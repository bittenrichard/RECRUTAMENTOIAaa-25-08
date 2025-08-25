// Caminho do arquivo: server.ts
// SUBSTITUA O CONTEÚDO INTEIRO DESTE ARQUIVO

import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

import express, { Request, Response } from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import { baserowServer } from './src/shared/services/baserowServerClient.js';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import multer from 'multer';

const app = express();
const port = 3001;

const upload = multer();

const corsOptions = {
  origin: '*'
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
  console.error("ERRO CRÍTICO: As credenciais do Google não foram encontradas...");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const USERS_TABLE_ID = '711';
const VAGAS_TABLE_ID = '709';
const CANDIDATOS_TABLE_ID = '710';
const WHATSAPP_CANDIDATOS_TABLE_ID = '712';
const AGENDAMENTOS_TABLE_ID = '713';
const SALT_ROUNDS = 10;
const TESTE_COMPORTAMENTAL_TABLE_ID = '727';
const TESTE_COMPORTAMENTAL_WEBHOOK_URL = process.env.TESTE_COMPORTAMENTAL_WEBHOOK_URL;
const N8N_TRIAGEM_WEBHOOK_URL = process.env.N8N_FILE_UPLOAD_URL;


interface BaserowJobPosting {
  id: number;
  titulo: string;
  usuario?: { id: number; value: string }[];
}

interface BaserowCandidate {
  id: number;
  vaga?: { id: number; value: string }[] | string | null;
  usuario?: { id: number; value: string }[] | null;
  nome: string;
  telefone: string | null;
  curriculo?: { url: string; name: string }[] | null;
  score?: number | null;
  resumo_ia?: string | null;
  status?: { id: number; value: 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado' } | null;
  data_triagem?: string;
  sexo?: string | null;
  escolaridade?: string | null;
  idade?: number | null;
}

app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { nome, empresa, telefone, email, password } = req.body;
  if (!email || !password || !nome) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
  }

  try {
    const emailLowerCase = email.toLowerCase();
    const { results: existingUsers } = await baserowServer.get(USERS_TABLE_ID, `?filter__Email__equal=${emailLowerCase}`);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await baserowServer.post(USERS_TABLE_ID, {
      nome,
      empresa,
      telefone,
      Email: emailLowerCase,
      senha_hash: hashedPassword,
    });

    const userProfile = {
      id: newUser.id,
      nome: newUser.nome,
      email: newUser.Email,
      empresa: newUser.empresa,
      telefone: newUser.telefone,
      avatar_url: newUser.avatar_url || null,
      google_refresh_token: newUser.google_refresh_token || null,
    };

    res.status(201).json({ success: true, user: userProfile });
  } catch (error: any) {
    console.error('Erro no registro (backend):', error);
    res.status(500).json({ error: error.message || 'Erro ao criar conta.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    const emailLowerCase = email.toLowerCase();
    const { results: users } = await baserowServer.get(USERS_TABLE_ID, `?filter__Email__equal=${emailLowerCase}`);
    const user = users && users[0];

    if (!user || !user.senha_hash) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.senha_hash);

    if (passwordMatches) {
      const userProfile = {
        id: user.id,
        nome: user.nome,
        email: user.Email,
        empresa: user.empresa,
        telefone: user.telefone,
        avatar_url: user.avatar_url || null,
        google_refresh_token: user.google_refresh_token || null,
      };
      res.json({ success: true, user: userProfile });
    } else {
      res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
  } catch (error: any) {
    console.error('Erro no login (backend):', error);
    res.status(500).json({ error: error.message || 'Erro ao fazer login.' });
  }
});

app.patch('/api/users/:userId/profile', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { nome, empresa, avatar_url } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
  }

  try {
    const updatedData: Record<string, any> = {};
    if (nome !== undefined) updatedData.nome = nome;
    if (empresa !== undefined) updatedData.empresa = empresa;
    if (avatar_url !== undefined) updatedData.avatar_url = avatar_url;

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ error: 'Nenhum dado para atualizar.' });
    }

    const updatedUser = await baserowServer.patch(USERS_TABLE_ID, parseInt(userId), updatedData);

    const userProfile = {
      id: updatedUser.id,
      nome: updatedUser.nome,
      email: updatedUser.Email,
      empresa: updatedUser.empresa,
      telefone: updatedUser.telefone,
      avatar_url: updatedUser.avatar_url || null,
      google_refresh_token: updatedUser.google_refresh_token || null,
    };

    res.status(200).json({ success: true, user: userProfile });
  } catch (error: any) {
    console.error('Erro ao atualizar perfil (backend):', error);
    res.status(500).json({ error: 'Não foi possível atualizar o perfil.' });
  }
});

app.patch('/api/users/:userId/password', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: 'ID do usuário e nova senha são obrigatórios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await baserowServer.patch(USERS_TABLE_ID, parseInt(userId), { senha_hash: hashedPassword });
    res.json({ success: true, message: 'Senha atualizada com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao atualizar senha (backend):', error);
    res.status(500).json({ error: 'Não foi possível atualizar a senha. Tente novamente.' });
  }
});

app.get('/api/users/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
  }
  try {
    const user = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId));
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    const userProfile = {
      id: user.id,
      nome: user.nome,
      email: user.Email,
      empresa: user.empresa,
      telefone: user.telefone,
      avatar_url: user.avatar_url || null,
      google_refresh_token: user.google_refresh_token || null,
    };
    res.json(userProfile);
  } catch (error: any) {
    console.error('Erro ao buscar perfil do usuário (backend):', error);
    res.status(500).json({ error: 'Não foi possível buscar o perfil do usuário.' });
  }
});

app.post('/api/upload-avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  const userId = req.body.userId;
  if (!userId || !req.file) {
    return res.status(400).json({ error: 'Arquivo e ID do usuário são obrigatórios.' });
  }

  try {
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const mimetype = req.file.mimetype;

    const uploadedFile = await baserowServer.uploadFileFromBuffer(fileBuffer, fileName, mimetype);
    const newAvatarUrl = uploadedFile.url;

    const updatedUser = await baserowServer.patch(USERS_TABLE_ID, parseInt(userId), { avatar_url: newAvatarUrl });

    const userProfile = {
      id: updatedUser.id,
      nome: updatedUser.nome,
      email: updatedUser.Email,
      empresa: updatedUser.empresa,
      telefone: updatedUser.telefone,
      avatar_url: updatedUser.avatar_url || null,
      google_refresh_token: updatedUser.google_refresh_token || null,
    };
    res.json({ success: true, avatar_url: newAvatarUrl, user: userProfile });

  } catch (error: any) {
    console.error('Erro ao fazer upload de avatar (backend):', error);
    res.status(500).json({ error: error.message || 'Não foi possível fazer upload do avatar.' });
  }
});

app.post('/api/jobs', async (req: Request, res: Response) => {
  const { titulo, descricao, endereco, requisitos_obrigatorios, requisitos_desejaveis, usuario } = req.body;
  if (!titulo || !descricao || !usuario || usuario.length === 0) {
    return res.status(400).json({ error: 'Título, descrição e ID do usuário são obrigatórios.' });
  }

  try {
    const createdJob = await baserowServer.post(VAGAS_TABLE_ID, {
      titulo,
      descricao,
      Endereco: endereco,
      requisitos_obrigatorios,
      requisitos_desejaveis,
      usuario,
    });
    res.status(201).json(createdJob);
  } catch (error: any) {
    console.error('Erro ao criar vaga (backend):', error);
    res.status(500).json({ error: 'Não foi possível criar a vaga.' });
  }
});

app.patch('/api/jobs/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const updatedData = req.body;
  if (!jobId || Object.keys(updatedData).length === 0) {
    return res.status(400).json({ error: 'ID da vaga e dados para atualização são obrigatórios.' });
  }

  try {
    const updatedJob = await baserowServer.patch(VAGAS_TABLE_ID, parseInt(jobId), updatedData);
    res.json(updatedJob);
  } catch (error: any) {
    console.error('Erro ao atualizar vaga (backend):', error);
    res.status(500).json({ error: 'Não foi possível atualizar a vaga.' });
  }
});

app.delete('/api/jobs/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  if (!jobId) {
    return res.status(400).json({ error: 'ID da vaga é obrigatório.' });
  }

  try {
    await baserowServer.delete(VAGAS_TABLE_ID, parseInt(jobId));
    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar vaga (backend):', error);
    res.status(500).json({ error: 'Não foi possível excluir a vaga.' });
  }
});

app.patch('/api/candidates/:candidateId/status', async (req: Request, res: Response) => {
  const { candidateId } = req.params;
  const { status } = req.body;

  if (!candidateId || !status) {
    return res.status(400).json({ error: 'ID do candidato e status são obrigatórios.' });
  }

  const validStatuses = ['Triagem', 'Entrevista', 'Aprovado', 'Reprovado'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status inválido fornecido.' });
  }

  try {
    const updatedCandidate = await baserowServer.patch(CANDIDATOS_TABLE_ID, parseInt(candidateId), { status: status });
    res.json(updatedCandidate);
  } catch (error: any) {
    console.error('Erro ao atualizar status do candidato (backend):', error);
    res.status(500).json({ error: 'Não foi possível atualizar o status do candidato.' });
  }
});

app.get('/api/data/all/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
  }

  try {
    const jobsResult = await baserowServer.get(VAGAS_TABLE_ID, '');
    const allJobs: BaserowJobPosting[] = (jobsResult.results || []) as BaserowJobPosting[];
    const userJobs = allJobs.filter((job: BaserowJobPosting) =>
      job.usuario && job.usuario.some((user: any) => user.id === parseInt(userId))
    );

    const userJobIds = new Set(userJobs.map(job => job.id));
    const jobsMapByTitle = new Map<string, BaserowJobPosting>(userJobs.map((job: BaserowJobPosting) => [job.titulo.toLowerCase().trim(), job]));
    const jobsMapById = new Map<number, BaserowJobPosting>(userJobs.map((job: BaserowJobPosting) => [job.id, job]));
    
    const behavioralTestsResult = await baserowServer.get(TESTE_COMPORTAMENTAL_TABLE_ID, `?filter__recrutador__link_row_has=${userId}`);
    const allBehavioralTests = behavioralTestsResult.results || [];
    
    const behavioralTestMap = new Map();
    allBehavioralTests.forEach(test => {
      if (test.candidato && test.candidato.length > 0) {
        const candidateId = test.candidato[0].id;
        behavioralTestMap.set(candidateId, test);
      }
    });

    const regularCandidatesResult = await baserowServer.get(CANDIDATOS_TABLE_ID, '');
    const whatsappCandidatesResult = await baserowServer.get(WHATSAPP_CANDIDATOS_TABLE_ID, '');

    const allCandidatesRaw: BaserowCandidate[] = [
      ...(regularCandidatesResult.results || []),
      ...(whatsappCandidatesResult.results || [])
    ] as BaserowCandidate[];

    const userCandidatesRaw = allCandidatesRaw.filter((candidate: BaserowCandidate) => {
      if (candidate.usuario && candidate.usuario.some((u: any) => u.id === parseInt(userId))) {
        return true;
      }

      if (candidate.vaga && typeof candidate.vaga === 'string') {
        const jobMatch = jobsMapByTitle.get(candidate.vaga.toLowerCase().trim());
        return !!jobMatch;
      }

      if (candidate.vaga && Array.isArray(candidate.vaga) && candidate.vaga.length > 0) {
        const vagaId = (candidate.vaga[0] as { id: number; value: string }).id;
        return userJobIds.has(vagaId);
      }

      return false;
    });

    const syncedCandidates = userCandidatesRaw.map((candidate: BaserowCandidate) => {
      let vagaLink: { id: number; value: string }[] | null = null;

      if (candidate.vaga && typeof candidate.vaga === 'string') {
        const jobMatch = jobsMapByTitle.get(candidate.vaga.toLowerCase().trim());
        if (jobMatch) {
          vagaLink = [{ id: jobMatch.id, value: jobMatch.titulo }];
        }
      } else if (candidate.vaga && Array.isArray(candidate.vaga) && candidate.vaga.length > 0) {
        const linkedVaga = candidate.vaga[0] as { id: number; value: string };
        if (jobsMapById.has(linkedVaga.id)) {
          vagaLink = [{ id: linkedVaga.id, value: linkedVaga.value }];
        }
      }

      const behavioralTest = behavioralTestMap.get(candidate.id);
      
      const enrichedCandidate = {
        ...candidate,
        vaga: vagaLink,
        // --- INÍCIO DA CORREÇÃO ---
        // Acessamos a propriedade 'value' do objeto de status para enviar apenas o texto.
        behavioral_test_status: behavioralTest && behavioralTest.status ? behavioralTest.status.value : null,
        // --- FIM DA CORREÇÃO ---
        resumo_perfil: behavioralTest ? behavioralTest.resumo_perfil : null,
        perfil_executor: behavioralTest ? behavioralTest.perfil_executor : null,
        perfil_comunicador: behavioralTest ? behavioralTest.perfil_comunicador : null,
        perfil_planejador: behavioralTest ? behavioralTest.perfil_planejador : null,
        perfil_analista: behavioralTest ? behavioralTest.perfil_analista : null,
      };

      return enrichedCandidate;
    });

    res.json({ jobs: userJobs, candidates: syncedCandidates });

  } catch (error: any) {
    console.error('Erro ao buscar todos os dados (backend):', error);
    res.status(500).json({ error: 'Falha ao carregar dados.' });
  }
});

app.post('/api/upload-curriculums', upload.array('curriculumFiles'), async (req: Request, res: Response) => {
  const { jobId, userId } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!jobId || !userId || !files || files.length === 0) {
    return res.status(400).json({ error: 'Vaga, usuário e arquivos de currículo são obrigatórios.' });
  }

  try {
    const newCandidateEntries = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: `O arquivo '${file.originalname}' é muito grande. O limite é de 5MB.` });
      }

      const uploadedFile = await baserowServer.uploadFileFromBuffer(file.buffer, file.originalname, file.mimetype);

      const newCandidateData = {
        nome: file.originalname.split('.')[0] || 'Novo Candidato',
        curriculo: [{ name: uploadedFile.name, url: uploadedFile.url }],
        usuario: [parseInt(userId as string)],
        vaga: [parseInt(jobId as string)],
        score: null,
        resumo_ia: null,
        status: 'Triagem',
      };

      const createdCandidate = await baserowServer.post(CANDIDATOS_TABLE_ID, newCandidateData);
      newCandidateEntries.push(createdCandidate);
    }

    const jobInfo = await baserowServer.getRow(VAGAS_TABLE_ID, parseInt(jobId as string));
    const userInfo = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId as string));

    if (N8N_TRIAGEM_WEBHOOK_URL && newCandidateEntries.length > 0 && jobInfo && userInfo) {
      const candidatosParaWebhook = newCandidateEntries.map(candidate => ({
        id: candidate.id,
        nome: candidate.nome,
        email: candidate.email,
        telefone: candidate.telefone,
        curriculo_url: candidate.curriculo?.[0]?.url,
        status: candidate.status
      }));

      const webhookPayload = {
        tipo: 'triagem_curriculo_lote',
        recrutador: { id: userInfo.id, nome: userInfo.nome, email: userInfo.Email, empresa: userInfo.empresa },
        vaga: { id: jobInfo.id, titulo: jobInfo.titulo, descricao: jobInfo.descricao, endereco: jobInfo.Endereco, requisitos_obrigatorios: jobInfo.requisitos_obrigatorios, requisitos_desejaveis: jobInfo.requisitos_desejaveis },
        candidatos: candidatosParaWebhook
      };

      const n8nResponse = await fetch(N8N_TRIAGEM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        throw new Error(`O N8N respondeu com um erro na triagem: ${n8nResponse.statusText} - ${errorText}`);
      }

      const updatedCandidatesResponse = await n8nResponse.json();
      res.json({ success: true, message: `${files.length} currículo(s) analisado(s) com sucesso!`, newCandidates: updatedCandidatesResponse.candidates || [] });

    } else {
      res.json({ success: true, message: `${files.length} currículo(s) enviado(s), mas não foram para análise.`, newCandidates: newCandidateEntries });
    }

  } catch (error: any) {
    console.error('Erro no upload de currículos (backend):', error);
    res.status(500).json({ success: false, message: error.message || 'Falha ao fazer upload dos currículos.' });
  }
});

app.get('/api/schedules/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
  }

  try {
    const { results } = await baserowServer.get(AGENDAMENTOS_TABLE_ID, `?filter__Candidato__usuario__link_row_has=${userId}`);
    res.json({ success: true, results: results || [] });
  } catch (error: any) {
    console.error('Erro ao buscar agendamentos (backend):', error);
    res.status(500).json({ success: false, message: 'Falha ao buscar agendamentos.' });
  }
});

app.get('/api/google/auth/connect', (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId é obrigatório' });
  }

  const scopes = ['https://www.googleapis.com/auth/calendar.events'];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: userId.toString(),
  });

  res.json({ url });
});

app.get('/api/google/auth/callback', async (req: Request, res: Response) => {
  const { code, state: userId } = req.query;
  const closePopupScript = `<script>window.close();</script>`;

  if (!code || !userId) {
    return res.send(closePopupScript);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    const { refresh_token } = tokens;

    if (refresh_token) {
      await baserowServer.patch(USERS_TABLE_ID, parseInt(userId as string), {
        google_refresh_token: refresh_token
      });
    }

    oauth2Client.setCredentials(tokens);

    res.send(closePopupScript);

  } catch (error: any) {
    console.error('[Google Auth Callback] ERRO DETALHADO na troca de código por token:', error.response?.data || error.message);
    res.status(500).send(`<html><body><h1>Erro na Autenticação</h1></body></html>`);
  }
});

app.post('/api/google/auth/disconnect', async (req: Request, res: Response) => {
  const { userId } = req.body;
  await baserowServer.patch(USERS_TABLE_ID, parseInt(userId), { google_refresh_token: null });
  res.json({ success: true, message: 'Conta Google desconectada.' });
});

app.get('/api/google/auth/status', async (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });
  try {
    const userResponse = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId as string));
    const isConnected = !!userResponse.google_refresh_token;
    res.json({ isConnected });
  } catch (error: any) {
    console.error('Erro ao verificar status da conexão Google para o usuário:', userId, error);
    res.status(500).json({ error: 'Erro ao verificar status da conexão.' });
  }
});

app.post('/api/google/calendar/create-event', async (req: Request, res: Response) => {
  const { userId, eventData, candidate, job } = req.body;
  if (!userId || !eventData || !candidate || !job) {
    return res.status(400).json({ success: false, message: 'Dados insuficientes.' });
  }

  try {
    const userResponse = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId));
    const refreshToken = userResponse.google_refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Usuário não conectado ao Google Calendar. Por favor, conecte sua conta em "Configurações".' });
    }

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const eventDescription = `Entrevista com o candidato: ${candidate.nome}.\n` +
      `Telefone: ${candidate.telefone || 'Não informado'}\n\n` +
      `--- Detalhes adicionais ---\n` +
      `${eventData.details || 'Nenhum detalhe adicional.'}`;
    const event = {
      summary: eventData.title,
      description: eventDescription,
      start: { dateTime: eventData.start, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: eventData.end, timeZone: 'America/Sao_Paulo' },
      reminders: { useDefault: true },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary', requestBody: event,
    });

    await baserowServer.post(AGENDAMENTOS_TABLE_ID, {
      'Título': eventData.title,
      'Início': eventData.start,
      'Fim': eventData.end,
      'Detalhes': eventData.details,
      'Candidato': [candidate.id],
      'Vaga': [job.id],
      'google_event_link': response.data.htmlLink
    });

    if (process.env.N8N_SCHEDULE_WEBHOOK_URL) {
      const webhookPayload = {
        recruiter: userResponse, candidate: candidate, job: job,
        interview: {
          title: eventData.title, startTime: eventData.start, endTime: eventData.end,
          details: eventData.details, googleEventLink: response.data.htmlLink
        }
      };
      fetch(process.env.N8N_SCHEDULE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      }).catch(webhookError => {
        console.error("Erro ao disparar o webhook para o n8n:", webhookError);
      });
    }
    res.json({ success: true, message: 'Evento criado com sucesso!', data: response.data });
  } catch (error: any) {
    console.error('Erro ao criar evento no Google Calendar:', error);
    res.status(500).json({ success: false, message: 'Falha ao criar evento.' });
  }
});

app.post('/api/behavioral-test/generate', async (req: Request, res: Response) => {
  const { candidateId, recruiterId } = req.body;
  if (!candidateId || !recruiterId) {
    return res.status(400).json({ error: 'ID do candidato e do recrutador são obrigatórios.' });
  }

  try {
    const newTestEntry = await baserowServer.post(TESTE_COMPORTAMENTAL_TABLE_ID, {
      candidato: [parseInt(candidateId as string)],
      recrutador: [parseInt(recruiterId as string)],
      status: 'Pendente',
    });

    res.status(201).json({ success: true, testId: newTestEntry.id });
  } catch (error: any) {
    console.error('Erro ao gerar link do teste comportamental:', error);
    res.status(500).json({ error: 'Não foi possível gerar o link do teste.' });
  }
});

app.patch('/api/behavioral-test/submit', async (req: Request, res: Response) => {
    const { testId, responses } = req.body;
    if (!testId || !responses) {
        return res.status(400).json({ error: 'ID do teste e respostas são obrigatórios.' });
    }

    try {
        await baserowServer.patch(TESTE_COMPORTAMENTAL_TABLE_ID, parseInt(testId), {
            data_de_resposta: new Date().toISOString(),
            respostas: JSON.stringify(responses),
            status: 'Processando',
        });
        
        console.log(`[Teste ${testId}] Disparando webhook para N8N e aguardando resposta...`);

        if (!TESTE_COMPORTAMENTAL_WEBHOOK_URL) {
          throw new Error('URL do webhook de teste comportamental não configurada no servidor.');
        }

        const n8nResponse = await fetch(TESTE_COMPORTAMENTAL_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testId: parseInt(testId), responses }),
        });

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text();
            throw new Error(`O N8N respondeu com um erro: ${n8nResponse.statusText} - ${errorText}`);
        }

        const n8nResultData = await n8nResponse.json();
        console.log(`[Teste ${testId}] Resposta recebida do N8N:`, JSON.stringify(n8nResultData, null, 2));
        
        let resultObject;
        if (Array.isArray(n8nResultData) && n8nResultData.length > 0) {
            resultObject = n8nResultData[0];
        } else if (typeof n8nResultData === 'object' && n8nResultData !== null && !Array.isArray(n8nResultData)) {
            resultObject = n8nResultData;
        } else {
            throw new Error('A resposta do N8N não é um objeto ou array válido, ou está vazia.');
        }

        const perfilAnalisado = resultObject?.perfil_analisado;
        if (!perfilAnalisado || !perfilAnalisado.pontuacoes) {
            throw new Error('A resposta do N8N não contém o objeto "perfil_analisado" ou "pontuacoes" esperado.');
        }

        const dataToUpdate = {
            resumo_perfil: perfilAnalisado.resumo,
            habilidades_comuns: perfilAnalisado.habilidades ? perfilAnalisado.habilidades.join(', ') : null,
            indicadores: perfilAnalisado.indicadores,
            perfil_executor: perfilAnalisado.pontuacoes.executor,
            perfil_comunicador: perfilAnalisado.pontuacoes.comunicador,
            perfil_planejador: perfilAnalisado.pontuacoes.planejador,
            perfil_analista: perfilAnalisado.pontuacoes.analista,
            status: 'Concluído'
        };
        
        const updatedTest = await baserowServer.patch(TESTE_COMPORTAMENTAL_TABLE_ID, parseInt(testId), dataToUpdate);
        
        res.status(200).json({ success: true, data: updatedTest });

    } catch (error: any) {
        console.error(`[Teste ${testId}] Erro no fluxo síncrono do teste:`, error.message);
        await baserowServer.patch(TESTE_COMPORTAMENTAL_TABLE_ID, parseInt(testId), { status: 'Erro' }).catch(err => console.error("Falha ao atualizar status para Erro:", err));
        res.status(500).json({ error: error.message || 'Erro ao processar o teste.' });
    }
});

app.get('/api/public/behavioral-test/:testId', async (req: Request, res: Response) => {
    const { testId } = req.params;
    if (!testId) {
        return res.status(400).json({ error: 'ID do teste é obrigatório.' });
    }
    try {
        const result = await baserowServer.getRow(TESTE_COMPORTAMENTAL_TABLE_ID, parseInt(testId));
        if (!result) {
            return res.status(404).json({ error: 'Teste não encontrado.' });
        }
        res.json({ success: true, data: { candidateName: result.candidato[0]?.value } });
    } catch (error: any) {
        res.status(500).json({ error: 'Não foi possível buscar os dados do teste.' });
    }
});

app.get('/api/behavioral-test/results/recruiter/:recruiterId', async (req: Request, res: Response) => {
  const { recruiterId } = req.params;
  if (!recruiterId) {
    return res.status(400).json({ error: 'ID do recrutador é obrigatório.' });
  }
  try {
    const { results } = await baserowServer.get(TESTE_COMPORTAMENTAL_TABLE_ID, `?filter__recrutador__link_row_has=${recruiterId}&order_by=-data_de_resposta`);
    res.json({ success: true, data: results || [] });
  } catch (error: any) {
    console.error('Erro ao buscar resultados de testes:', error);
    res.status(500).json({ error: 'Não foi possível carregar os resultados.' });
  }
});

app.get('/api/behavioral-test/result/:testId', async (req: Request, res: Response) => {
    const { testId } = req.params;
    if (!testId) {
        return res.status(400).json({ error: 'ID do teste é obrigatório.' });
    }
    try {
        const result = await baserowServer.getRow(TESTE_COMPORTAMENTAL_TABLE_ID, parseInt(testId));
        if (!result) {
            return res.status(404).json({ error: 'Resultado do teste não encontrado.' });
        }
        
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.json({ success: true, data: result });
    } catch (error: any) {
        console.error(`Erro ao buscar resultado do teste ${testId} (backend):`, error);
        res.status(500).json({ error: 'Não foi possível buscar o resultado do teste.' });
    }
});


app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});