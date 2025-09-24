// Caminho: server.ts
// SUBSTITUA O CONTEÚDO INTEIRO DESTE ARQUIVO

import dotenv from 'dotenv';
// Carrega primeiro o .env padrão
dotenv.config({ path: '.env' });
// Depois carrega o específico do ambiente, sobrescrevendo se necessário
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}`, override: false });

import express, { Request, Response } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { google } from 'googleapis';
import { baserowServer } from './src/shared/services/baserowServerClient.js';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import multer from 'multer';

// Interfaces para Sistema de Provas Teóricas
interface Question {
  id?: string;
  tipo: 'verdadeiro_falso' | 'dissertativa' | 'multipla_escolha';
  enunciado: string;
  opcoes?: string[]; // Para múltipla escolha
  resposta_correta?: string; // Para verdadeiro/falso e múltipla escolha
  pontuacao: number;
}

interface TestModel {
  id?: string;
  nome: string;
  descricao: string;
  tempo_limite: number; // em minutos
  questoes: Question[];
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AppliedTest {
  id?: string;
  candidato_id: string;
  modelo_prova_id: string;
  questoes_respostas: { questao_id: string; resposta: string; pontuacao_obtida?: number }[];
  pontuacao_total?: number;
  status: 'em_andamento' | 'finalizada' | 'expirada';
  data_inicio?: string;
  data_finalizacao?: string;
  tempo_restante?: number;
}

const app = express();
const port = process.env.PORT || 3001;

// Configuração do Multer para upload de ficheiros em memória
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB para vídeos
    fieldSize: 100 * 1024 * 1024  // 100MB para campos
  }
});

// Configuração de CORS para produção
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.BACKEND_URL].filter(Boolean)
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Configurações de segurança para produção
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', process.env.TRUST_PROXY === 'true');
}

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));


// Configuração de credenciais OAuth baseada no ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const GOOGLE_CLIENT_ID = isDevelopment ? 
  (process.env.GOOGLE_CLIENT_ID_DEV || process.env.GOOGLE_CLIENT_ID) : 
  process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = isDevelopment ? 
  (process.env.GOOGLE_CLIENT_SECRET_DEV || process.env.GOOGLE_CLIENT_SECRET) : 
  process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

console.log(`[OAuth Setup] Ambiente: ${isDevelopment ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'}`);
console.log(`[OAuth Setup] Client ID: ${GOOGLE_CLIENT_ID?.substring(0, 20)}...`);
console.log(`[OAuth Setup] Redirect URI: ${GOOGLE_REDIRECT_URI}`);

// Validação de variáveis de ambiente mais inteligente
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'GOOGLE_REDIRECT_URI',
  'VITE_BASEROW_API_KEY',
  'TESTE_COMPORTAMENTAL_WEBHOOK_URL'
];

// Só valida se estamos realmente tentando usar as variáveis
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn("⚠️  AVISO: Algumas variáveis de ambiente estão faltando:");
  missingVars.forEach(varName => console.warn(`  - ${varName}`));
  console.warn("🔧 Sistema continuará em modo limitado. Verifique o arquivo .env se necessário.");
  
  // Só sai do processo se for crítico para o funcionamento
  if (missingVars.includes('GOOGLE_CLIENT_ID') || missingVars.includes('GOOGLE_CLIENT_SECRET')) {
    console.error("❌ ERRO CRÍTICO: Credenciais do Google são obrigatórias.");
    console.error("Verifique o arquivo .env ou as configurações do container");
    // process.exit(1); // Removido para permitir desenvolvimento sem algumas funcionalidades
  }
}

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.error("⚠️  AVISO: As credenciais do Google não foram encontradas...");
  console.error("🔧 Algumas funcionalidades do Google Calendar podem não funcionar.");
  console.error("Verifique as variáveis de ambiente no arquivo .env");
  // process.exit(1); // Removido para permitir desenvolvimento
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

const USERS_TABLE_ID = '711';
const VAGAS_TABLE_ID = '709';
const CANDIDATOS_TABLE_ID = '710';
const WHATSAPP_CANDIDATOS_TABLE_ID = '712';
const AGENDAMENTOS_TABLE_ID = '713';
const SALT_ROUNDS = 10;
const TESTE_COMPORTAMENTAL_TABLE_ID = '727';
const PROVAS_TEORICAS_MODELOS_TABLE_ID = '729';
const PROVAS_TEORICAS_APLICADAS_TABLE_ID = '730';
const TESTE_COMPORTAMENTAL_WEBHOOK_URL = process.env.TESTE_COMPORTAMENTAL_WEBHOOK_URL;
const N8N_TRIAGEM_WEBHOOK_URL = process.env.N8N_FILE_UPLOAD_URL;
const N8N_EMAIL_WEBHOOK_URL = process.env.N8N_EMAIL_WEBHOOK_URL;
const N8N_THEORETICAL_WEBHOOK_URL = process.env.N8N_THEORETICAL_WEBHOOK_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://recrutamentoia.com.br';


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

// Endpoint: Solicitar reset de senha
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório.' });
  }

  try {
    const emailLowerCase = email.toLowerCase();
    
    // 1. Buscar usuário no Baserow Users (711)
    const { results: users } = await baserowServer.get(USERS_TABLE_ID, `?filter__Email__equal=${emailLowerCase}`);
    const user = users && users[0];
    
    if (!user) {
      return res.status(404).json({ error: 'Email não encontrado.' });
    }
    
    // 2. Gerar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora
    
    // 3. Salvar no Baserow
    await baserowServer.patch(USERS_TABLE_ID, user.id, {
      reset_token: resetToken,
      reset_expires: resetExpires.toISOString()
    });
    
    // 4. Disparar N8N webhook para envio de email (se configurado)
    if (N8N_EMAIL_WEBHOOK_URL) {
      try {
        await fetch(N8N_EMAIL_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailLowerCase,
            resetToken,
            resetLink: `${FRONTEND_URL}/reset-password/${resetToken}`,
            userName: user.nome || 'Usuário'
          })
        });
        console.log(`[FORGOT PASSWORD] Email de recuperação enviado para: ${emailLowerCase}`);
      } catch (emailError) {
        console.error('[FORGOT PASSWORD] Erro ao enviar email via N8N:', emailError);
        // Não falhar a requisição se o email não for enviado
      }
    }
    
    res.json({ message: 'Email de recuperação enviado com sucesso.' });
    
  } catch (error: unknown) {
    console.error('[FORGOT PASSWORD] Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Endpoint: Confirmar reset de senha
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    // 1. Validar token no Baserow
    const now = new Date().toISOString();
    const { results: users } = await baserowServer.get(USERS_TABLE_ID, 
      `?filter__reset_token__equal=${token}&filter__reset_expires__date_after=${now}`
    );
    const user = users && users[0];
    
    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }
    
    // 2. Hash nova senha
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    // 3. Atualizar no Baserow
    await baserowServer.patch(USERS_TABLE_ID, user.id, {
      senha_hash: hashedPassword,
      reset_token: null,
      reset_expires: null
    });
    
    console.log(`[RESET PASSWORD] Senha alterada com sucesso para usuário ID: ${user.id}`);
    res.json({ message: 'Senha alterada com sucesso.' });
    
  } catch (error: unknown) {
    console.error('[RESET PASSWORD] Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
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

// ==================================================================
// === HEALTH CHECK ===
// ==================================================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'recrutamento-backend',
    version: '1.0.0'
  });
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Backend do Sistema de Recrutamento está funcionando!',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// ==================================================================
// === INÍCIO DAS NOVAS FUNCIONALIDADES (FASE 1) =======================
// ==================================================================

// 1. ROTA DE ATUALIZAÇÃO DE STATUS - Agora mais flexível e com os novos status
app.patch('/api/candidates/:candidateId/status', async (req: Request, res: Response) => {
  const { candidateId } = req.params;
  const { status } = req.body;

  if (!candidateId || !status) {
    return res.status(400).json({ error: 'ID do candidato e status são obrigatórios.' });
  }

  // Validação com a nova lista de status do funil
  const validStatuses = [
    'Triagem', 'Entrevista por Vídeo', 'Teste Teórico',
    'Teste Prático', 'Contratado', 'Aprovado', 'Reprovado', 'Entrevista'
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status fornecido é inválido.' });
  }

  try {
    const updatedCandidate = await baserowServer.patch(CANDIDATOS_TABLE_ID, parseInt(candidateId), { status: status });
    res.json(updatedCandidate);
  } catch (error: any) {
    console.error('Erro ao atualizar status do candidato (backend):', error);
    res.status(500).json({ error: 'Não foi possível atualizar o status do candidato.' });
  }
});

// 2. NOVA ROTA - Upload de Vídeo de Entrevista
app.post('/api/candidates/:candidateId/video-interview', upload.single('video'), async (req: Request, res: Response) => {
    const { candidateId } = req.params;
    const file = req.file;

    if (!candidateId) {
        return res.status(400).json({ error: 'ID do candidato é obrigatório.' });
    }

    if (!file) {
        return res.status(400).json({ error: 'Nenhum ficheiro de vídeo foi enviado.' });
    }

    // Validar tamanho do arquivo (100MB)
    if (file.size > 100 * 1024 * 1024) {
        return res.status(413).json({ error: 'Arquivo muito grande. Limite máximo: 100MB.' });
    }

    // Validar tipo de arquivo
    const allowedTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
    if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ error: 'Tipo de arquivo não suportado. Use MP4, WebM, MOV ou AVI.' });
    }

    try {
        console.log(`[Upload Video] Processando upload para candidato ${candidateId}, arquivo: ${file.originalname}, tamanho: ${file.size} bytes`);
        
        const uploadedFileData = await baserowServer.uploadFileFromBuffer(file.buffer, file.originalname, file.mimetype);
        
        console.log(`[Upload Video] Arquivo enviado para Baserow:`, uploadedFileData);
        
        // Atualiza a linha do candidato com o ficheiro de vídeo
        const updatedCandidate = await baserowServer.patch(CANDIDATOS_TABLE_ID, parseInt(candidateId), {
            video_entrevista: [{ name: uploadedFileData.name, url: uploadedFileData.url }],
        });

        console.log(`[Upload Video] Candidato atualizado com sucesso`);

        res.status(200).json({
            message: 'Vídeo de entrevista enviado com sucesso!',
            candidate: updatedCandidate
        });

    } catch (error: any) {
        console.error('Erro no upload do vídeo de entrevista:', error);
        
        if (error.message?.includes('413') || error.message?.includes('too large')) {
            return res.status(413).json({ error: 'Arquivo muito grande para upload.' });
        }
        
        res.status(500).json({ error: 'Falha ao processar o upload do vídeo.' });
    }
});

// 3. NOVA ROTA - Upload de Resultado do Teste Teórico
app.post('/api/candidates/:candidateId/theoretical-test', upload.single('testResult'), async (req, res) => {
    const { candidateId } = req.params;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'Nenhum ficheiro de resultado foi enviado.' });
    }

    try {
        const uploadedFileData = await baserowServer.uploadFileFromBuffer(file.buffer, file.originalname, file.mimetype);
        
        // Atualiza a linha do candidato com o resultado do teste
        // O nome do campo deve ser EXATAMENTE o mesmo que está no Baserow: `resultado_teste_teorico`
        const updatedCandidate = await baserowServer.patch(CANDIDATOS_TABLE_ID, parseInt(candidateId), {
            resultado_teste_teorico: [{ name: uploadedFileData.name, url: uploadedFileData.url }],
        });

        res.status(200).json({
            message: 'Resultado do teste enviado com sucesso!',
            candidate: updatedCandidate
        });

    } catch (error: any) {
        console.error('Erro no upload do resultado do teste:', error.message);
        res.status(500).json({ error: 'Falha ao processar o upload do resultado.' });
    }
});

// 4. NOVA ROTA - Atualização Manual da Última Data de Contato
app.patch('/api/candidates/:candidateId/update-contact', async (req: Request, res: Response) => {
    const { candidateId } = req.params;
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    try {
        // Atualiza o campo ultima_atualizacao com a data atual
        const updatedCandidate = await baserowServer.patch(CANDIDATOS_TABLE_ID, parseInt(candidateId), {
            ultima_atualizacao: new Date().toISOString(),
        });

        res.status(200).json({
            message: 'Data de contato atualizada com sucesso!',
            candidate: updatedCandidate
        });

    } catch (error: any) {
        console.error('Erro ao atualizar data de contato:', error.message);
        res.status(500).json({ error: 'Falha ao atualizar data de contato.' });
    }
});


// ==================================================================
// === FIM DAS NOVAS FUNCIONALIDADES (FASE 1) =========================
// ==================================================================


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
        behavioral_test_status: behavioralTest && behavioralTest.status ? behavioralTest.status.value : null,
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

// Rota alternativa para upload de currículos (compatibilidade com frontend)
app.post('/api/upload', upload.any(), async (req: Request, res: Response) => {
  console.log('[UPLOAD DEBUG] Dados recebidos:', {
    body: req.body,
    files: req.files ? (req.files as Express.Multer.File[]).length : 0,
    filesInfo: req.files ? (req.files as Express.Multer.File[]).map(f => ({ name: f.originalname, size: f.size, fieldname: f.fieldname })) : []
  });

  const { jobId, userId } = req.body;
  const files = req.files as Express.Multer.File[];

  console.log('[UPLOAD DEBUG] Parâmetros extraídos:', { jobId, userId, filesCount: files?.length || 0 });

  if (!jobId || !userId || !files || files.length === 0) {
    console.log('[UPLOAD DEBUG] Erro: parâmetros obrigatórios faltando');
    return res.status(400).json({ error: 'Vaga, usuário e arquivos de currículo são obrigatórios.' });
  }

  try {
    const newCandidateEntries = [];
    const filesWithBase64 = []; // Para armazenar arquivo + base64
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: `O arquivo '${file.originalname}' é muito grande. O limite é de 5MB.` });
      }

      // Converter arquivo para base64
      const base64Content = file.buffer.toString('base64');
      console.log(`[UPLOAD DEBUG] Base64 gerado para ${file.originalname}, tamanho: ${base64Content.length} chars`);
      
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
      
      // Armazenar arquivo com base64 para o webhook
      filesWithBase64.push({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        base64: base64Content,
        candidateId: createdCandidate.id
      });
    }

    const jobInfo = await baserowServer.getRow(VAGAS_TABLE_ID, parseInt(jobId as string));
    const userInfo = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId as string));

    if (N8N_TRIAGEM_WEBHOOK_URL && newCandidateEntries.length > 0 && jobInfo && userInfo) {
      const candidatosParaWebhook = newCandidateEntries.map(candidate => {
        // Encontrar o arquivo base64 correspondente ao candidato
        const fileData = filesWithBase64.find(f => f.candidateId === candidate.id);
        
        return {
          id: candidate.id,
          nome: candidate.nome,
          email: candidate.email,
          telefone: candidate.telefone,
          curriculo_url: candidate.curriculo?.[0]?.url,
          status: candidate.status,
          // Adicionar dados do arquivo base64
          arquivo: fileData ? {
            nome: fileData.originalname,
            tipo: fileData.mimetype,
            tamanho: fileData.size,
            base64: fileData.base64
          } : null
        };
      });

      console.log('[UPLOAD DEBUG] Payload sendo enviado para N8N:', {
        candidatos: candidatosParaWebhook.length,
        temBase64: candidatosParaWebhook.some(c => c.arquivo?.base64)
      });

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
    console.error('Erro no upload de currículos (backend /api/upload):', error);
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

  // Para desenvolvimento local, usar configuração específica
  const isDevelopment = process.env.NODE_ENV === 'development';
  console.log('[Google Auth Connect] Ambiente:', isDevelopment ? 'desenvolvimento' : 'produção');
  console.log('[Google Auth Connect] GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: userId.toString(),
  });

  console.log('[Google Auth Connect] URL gerada:', url);
  res.json({ url });
});

app.get('/api/google/auth/callback', async (req: Request, res: Response) => {
  const { code, state: userId } = req.query;
  const closePopupScript = `<script>window.close();</script>`;

  if (!code || !userId) {
    return res.send(closePopupScript);
  }

  try {
    console.log('[Google Auth Callback] Recebendo callback...');
    console.log('[Google Auth Callback] Code:', code);
    console.log('[Google Auth Callback] UserId:', userId);
    
    const { tokens } = await oauth2Client.getToken(code as string);
    console.log('[Google Auth Callback] Tokens recebidos:', { 
      access_token: tokens.access_token ? 'presente' : 'ausente',
      refresh_token: tokens.refresh_token ? 'presente' : 'ausente' 
    });
    
    const { refresh_token } = tokens;

    if (refresh_token) {
      console.log('[Google Auth Callback] Salvando refresh_token para userId:', userId);
      await baserowServer.patch(USERS_TABLE_ID, parseInt(userId as string), {
        google_refresh_token: refresh_token
      });
      console.log('[Google Auth Callback] Refresh token salvo com sucesso');
    } else {
      console.warn('[Google Auth Callback] Nenhum refresh_token recebido - usuário pode já ter autorizado antes');
    }

    oauth2Client.setCredentials(tokens);

    res.send(closePopupScript);

  } catch (error: any) {
    console.error('[Google Auth Callback] ERRO DETALHADO na troca de código por token:', error.response?.data || error.message);
    console.error('[Google Auth Callback] Stack trace:', error.stack);
    res.status(500).send(`<html><body><h1>Erro na Autenticação</h1><p>Detalhes: ${error.message}</p></body></html>`);
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
  
  console.log(`[Behavioral Test] Requisição recebida:`, { candidateId, recruiterId });
  
  if (!candidateId || !recruiterId) {
    console.log(`[Behavioral Test] Erro: dados obrigatórios faltando`);
    return res.status(400).json({ error: 'ID do candidato e do recrutador são obrigatórios.' });
  }

  try {
    console.log(`[Behavioral Test] Criando entrada na tabela ${TESTE_COMPORTAMENTAL_TABLE_ID}`);
    
    const newTestEntry = await baserowServer.post(TESTE_COMPORTAMENTAL_TABLE_ID, {
      candidato: [parseInt(candidateId as string)],
      recrutador: [parseInt(recruiterId as string)],
      status: 'Pendente',
    });

    console.log(`[Behavioral Test] Teste criado com sucesso:`, newTestEntry.id);
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

// ========================================
// ENDPOINTS - SISTEMA DE PROVAS TEÓRICAS
// ========================================

// GET /api/theoretical-models - Listar todos os modelos de prova
app.get('/api/theoretical-models', async (req: Request, res: Response) => {
  try {
    const { results } = await baserowServer.get(PROVAS_TEORICAS_MODELOS_TABLE_ID);
    
    const models = results.map((model: any) => ({
      id: model.id,
      nome: model.titulo,        // Campo é 'titulo' no Baserow
      descricao: model.descricao,
      tempo_limite: model.tempo_limite,
      questoes: JSON.parse(model.perguntas || '[]'), // Campo é 'perguntas' no Baserow
      ativo: model.ativo,
      created_at: model.created_at || null,
      updated_at: model.updated_at || null
    }));

    res.json({ success: true, data: models });
  } catch (error: unknown) {
    console.error('Erro ao buscar modelos de prova:', error);
    res.status(500).json({ error: 'Não foi possível carregar os modelos de prova.' });
  }
});

// GET /api/theoretical-models/:id - Buscar modelo específico
app.get('/api/theoretical-models/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(id));
    
    if (!model) {
      return res.status(404).json({ error: 'Modelo de prova não encontrado.' });
    }

    const formattedModel = {
      id: model.id,
      nome: model.titulo,        // Campo é 'titulo' no Baserow
      descricao: model.descricao,
      tempo_limite: model.tempo_limite,
      questoes: JSON.parse(model.perguntas || '[]'), // Campo é 'perguntas' no Baserow
      ativo: model.ativo,
      created_at: model.created_at || null,
      updated_at: model.updated_at || null
    };

    res.json({ success: true, data: formattedModel });
  } catch (error: unknown) {
    console.error('Erro ao buscar modelo de prova:', error);
    res.status(500).json({ error: 'Não foi possível buscar o modelo de prova.' });
  }
});

// POST /api/theoretical-models - Criar novo modelo de prova
app.post('/api/theoretical-models', async (req: Request, res: Response) => {
  console.log('📝 POST /api/theoretical-models - Body recebido:', JSON.stringify(req.body, null, 2));
  
  const { nome, descricao, tempo_limite, questoes, ativo } = req.body;

  // Validação flexível (similar ao sistema de currículos)
  if (!nome || nome.trim().length === 0) {
    console.log('❌ Validação falhou - nome obrigatório');
    return res.status(400).json({ 
      error: 'Nome é obrigatório.' 
    });
  }

  if (tempo_limite === undefined || tempo_limite === null || Number(tempo_limite) <= 0) {
    console.log('❌ Validação falhou - tempo limite inválido:', tempo_limite);
    return res.status(400).json({ 
      error: 'Tempo limite deve ser maior que zero.' 
    });
  }

  if (!questoes || !Array.isArray(questoes) || questoes.length === 0) {
    console.log('❌ Validação falhou - questões inválidas');
    return res.status(400).json({ 
      error: 'Pelo menos uma questão é obrigatória.' 
    });
  }

  console.log('✅ Validação passou - criando prova teórica');

  try {
    // Conversão e processamento dos dados (similar ao sistema de currículos)
    const tempoLimiteNum = typeof tempo_limite === 'string' ? parseFloat(tempo_limite) : tempo_limite;
    const ativoBoolean = ativo === 'Ativo' || ativo === true || ativo === 'true';

    // Processar questões - gerar IDs se necessário
    const questoesComId = questoes.map((questao: any) => ({
      ...questao,
      id: questao.id || crypto.randomUUID()
    }));

    // Criar dados para o Baserow usando os nomes corretos dos campos
    const newModelData = {
      titulo: String(nome).trim(),        // Campo é 'titulo' no Baserow, não 'nome'
      descricao: descricao ? String(descricao).trim() : '', 
      tempo_limite: tempoLimiteNum,
      perguntas: JSON.stringify(questoesComId), // Campo é 'perguntas' no Baserow, não 'questoes'
      ativo: ativoBoolean
    };

    console.log('📤 Criando modelo no Baserow:', newModelData);
    console.log('🏗️ Table ID usado:', PROVAS_TEORICAS_MODELOS_TABLE_ID);

    const createdModel = await baserowServer.post(PROVAS_TEORICAS_MODELOS_TABLE_ID, newModelData);
    
    console.log('✅ Modelo criado com sucesso - ID:', createdModel.id);
    console.log('🔍 Dados retornados do Baserow:', JSON.stringify(createdModel, null, 2));

    // Tratamento seguro do campo questões usando nome correto do Baserow
    let questoesParsed;
    try {
      if (createdModel.perguntas && typeof createdModel.perguntas === 'string') {
        questoesParsed = JSON.parse(createdModel.perguntas);
        console.log('✅ Questões recuperadas do Baserow com sucesso');
      } else {
        console.log('⚠️ Campo perguntas não retornado pelo Baserow, usando questões originais');
        questoesParsed = questoesComId; // Usar as questões que enviamos
      }
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse das questões:', parseError);
      questoesParsed = questoesComId; // Fallback para questões originais
    }

    // Formatar resposta usando nomes corretos dos campos Baserow
    const responseData = {
      id: createdModel.id,
      nome: createdModel.titulo || nome,           // Campo é 'titulo' no Baserow
      descricao: createdModel.descricao || descricao,
      tempo_limite: createdModel.tempo_limite || tempoLimiteNum,
      questoes: questoesParsed,
      ativo: createdModel.ativo !== undefined ? createdModel.ativo : ativoBoolean,
      created_at: createdModel.created_at || null,
      updated_at: createdModel.updated_at || null
    };

    res.status(201).json({ success: true, data: responseData });

  } catch (error: any) {
    console.error('Erro ao criar modelo de prova (backend):', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Falha ao criar modelo de prova.' 
    });
  }
});

// PUT /api/theoretical-models/:id - Atualizar modelo de prova
app.put('/api/theoretical-models/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`📝 PUT /api/theoretical-models/${id} - Body recebido:`, JSON.stringify(req.body, null, 2));
  
  // Extrair apenas os campos válidos (ignorar categoria, nivel_dificuldade que não existem na tabela)
  const { nome, descricao, tempo_limite, questoes, ativo } = req.body;

  // Conversão de tipos para compatibilidade com diferentes formatos do frontend
  const tempoLimiteConvertido = typeof tempo_limite === 'string' ? parseFloat(tempo_limite) : tempo_limite;
  const ativoConvertido = ativo === 'Ativo' || ativo === true || ativo === 'true' ? true : 
                         ativo === 'Inativo' || ativo === false || ativo === 'false' ? false : ativo;

  try {
    // Verificar se o modelo existe
    console.log(`🔍 Verificando se modelo ${id} existe...`);
    const existingModel = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(id));
    if (!existingModel) {
      console.log(`❌ Modelo ${id} não encontrado`);
      return res.status(404).json({ error: 'Modelo de prova não encontrado.' });
    }
    console.log(`✅ Modelo ${id} encontrado`);

    console.log('🔍 Valores recebidos para atualização:');
    console.log('  - nome:', nome, '(tipo:', typeof nome, ')');
    console.log('  - descricao:', descricao, '(tipo:', typeof descricao, ')');  
    console.log('  - tempo_limite original:', tempo_limite, '(tipo:', typeof tempo_limite, ')');
    console.log('  - tempo_limite convertido:', tempoLimiteConvertido);
    console.log('  - ativo original:', ativo, '(tipo:', typeof ativo, ')');
    console.log('  - ativo convertido:', ativoConvertido);
    console.log('  - questoes:', questoes ? `${questoes.length} questões` : 'undefined');

    const updateData: Record<string, string | number | boolean> = {};

    if (nome !== undefined && typeof nome === 'string') updateData.titulo = nome.trim(); // Campo é 'titulo' no Baserow
    if (descricao !== undefined && typeof descricao === 'string') updateData.descricao = descricao.trim();
    if (tempoLimiteConvertido !== undefined && typeof tempoLimiteConvertido === 'number' && tempoLimiteConvertido > 0) {
      updateData.tempo_limite = tempoLimiteConvertido;
    }
    if (ativoConvertido !== undefined) updateData.ativo = Boolean(ativoConvertido);
    
    if (questoes !== undefined && Array.isArray(questoes)) {
      console.log(`🔍 Validando ${questoes.length} questões para atualização...`);
      
      // Validar questões
      for (const questao of questoes) {
        if (!questao.enunciado || !questao.tipo || questao.pontuacao === undefined) {
          console.log('❌ Questão inválida encontrada:', questao);
          return res.status(400).json({ 
            error: 'Cada questão deve ter enunciado, tipo e pontuação.' 
          });
        }
      }

      // Manter IDs existentes ou gerar novos
      const questoesComId = questoes.map(questao => ({
        ...questao,
        id: questao.id || crypto.randomUUID()
      }));

      updateData.perguntas = JSON.stringify(questoesComId); // Campo é 'perguntas' no Baserow
      console.log('✅ Questões validadas e processadas');
    }

    console.log('📤 Dados de atualização para Baserow:', JSON.stringify(updateData, null, 2));

    const updatedModel = await baserowServer.patch(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(id), updateData);

    const formattedModel = {
      id: updatedModel.id,
      nome: updatedModel.titulo,        // Campo é 'titulo' no Baserow
      descricao: updatedModel.descricao,
      tempo_limite: updatedModel.tempo_limite,
      questoes: JSON.parse(updatedModel.perguntas || '[]'), // Campo é 'perguntas' no Baserow
      ativo: updatedModel.ativo,
      created_at: updatedModel.created_at || null,
      updated_at: updatedModel.updated_at || null
    };

    res.json({ success: true, data: formattedModel });
  } catch (error: unknown) {
    console.error('🚨 ERRO DETALHADO ao atualizar modelo de prova:');
    console.error('  - ID do modelo:', id);
    console.error('  - Erro completo:', error);
    console.error('  - Message:', error instanceof Error ? error.message : 'Erro desconhecido');
    console.error('  - Stack:', error instanceof Error ? error.stack : 'Sem stack trace');
    console.error('  - Nome:', nome);
    console.error('  - Descricao:', descricao);
    console.error('  - Tempo limite convertido:', tempoLimiteConvertido);
    console.error('  - Ativo convertido:', ativoConvertido);
    
    res.status(500).json({ 
      error: 'Não foi possível atualizar o modelo de prova.',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// DELETE /api/theoretical-models/:id - Deletar modelo de prova FISICAMENTE
app.delete('/api/theoretical-models/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`🗑️ DELETE Request - ID: ${id}`);

  try {
    // Verificar se o modelo existe
    console.log(`🔍 Verificando se modelo ${id} existe...`);
    const existingModel = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(id));
    if (!existingModel) {
      console.log(`❌ Modelo ${id} não encontrado`);
      return res.status(404).json({ error: 'Modelo de prova não encontrado.' });
    }
    console.log(`✅ Modelo ${id} encontrado:`, existingModel.nome);

    // SEMPRE deletar fisicamente - removendo a verificação de provas aplicadas
    console.log(`🗑️ Deletando modelo ${id} FISICAMENTE do Baserow...`);
    await baserowServer.delete(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(id));
    console.log(`✅ Modelo ${id} deletado com sucesso do Baserow`);
    
    res.json({ 
      success: true, 
      message: 'Modelo de prova deletado com sucesso.',
      action: 'deleted'
    });
  } catch (error: unknown) {
    console.error(`❌ Erro ao deletar modelo ${id}:`, error);
    res.status(500).json({ error: 'Não foi possível deletar o modelo de prova.' });
  }
});

// POST /api/theoretical-test/generate - Gerar prova para candidato
app.post('/api/theoretical-test/generate', async (req: Request, res: Response) => {
  const { candidato_id, modelo_prova_id }: { candidato_id: string; modelo_prova_id: string } = req.body;

  if (!candidato_id || !modelo_prova_id) {
    return res.status(400).json({ 
      error: 'ID do candidato e ID do modelo de prova são obrigatórios.' 
    });
  }

  try {
    // Verificar se o candidato existe
    const candidate = await baserowServer.getRow(CANDIDATOS_TABLE_ID, parseInt(candidato_id));
    if (!candidate) {
      return res.status(404).json({ error: 'Candidato não encontrado.' });
    }

    // Verificar se o modelo existe e está ativo
    const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(modelo_prova_id));
    if (!model) {
      return res.status(404).json({ error: 'Modelo de prova não encontrado.' });
    }

    if (!model.ativo) {
      return res.status(400).json({ error: 'Este modelo de prova não está ativo.' });
    }

    // Verificar se já existe prova em andamento para este candidato
    const { results: existingTests } = await baserowServer.get(
      PROVAS_TEORICAS_APLICADAS_TABLE_ID, 
      `?filter__candidato_id=${candidato_id}&filter__status=em_andamento`
    );

    if (existingTests && existingTests.length > 0) {
      return res.status(400).json({ 
        error: 'Este candidato já possui uma prova em andamento.' 
      });
    }

    // Criar nova prova aplicada
    const questoes = JSON.parse(model.questoes || '[]');
    const questoesRespostas = questoes.map((questao: Question) => ({
      questao_id: questao.id,
      resposta: '',
      pontuacao_obtida: 0
    }));

    const appliedTestData = {
      candidato_id,
      modelo_prova_id,
      questoes_respostas: JSON.stringify(questoesRespostas),
      status: 'em_andamento',
      data_inicio: new Date().toISOString(),
      tempo_restante: model.tempo_limite
    };

    const createdTest = await baserowServer.post(PROVAS_TEORICAS_APLICADAS_TABLE_ID, appliedTestData);

    // Enviar notificação via N8N (se configurado)
    if (N8N_THEORETICAL_WEBHOOK_URL) {
      try {
        await fetch(N8N_THEORETICAL_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'prova_gerada',
            candidato: {
              id: candidate.id,
              nome: candidate.nome,
              email: candidate.email
            },
            prova: {
              id: createdTest.id,
              nome_modelo: model.nome,
              tempo_limite: model.tempo_limite
            }
          })
        });
      } catch (webhookError) {
        console.error('Erro ao enviar webhook de prova gerada:', webhookError);
      }
    }

    const formattedTest = {
      id: createdTest.id,
      candidato_id: createdTest.candidato_id,
      modelo_prova_id: createdTest.modelo_prova_id,
      questoes_respostas: JSON.parse(createdTest.questoes_respostas),
      status: createdTest.status,
      data_inicio: createdTest.data_inicio,
      tempo_restante: createdTest.tempo_restante
    };

    res.status(201).json({ success: true, data: formattedTest });
  } catch (error: unknown) {
    console.error('Erro ao gerar prova para candidato:', error);
    res.status(500).json({ error: 'Não foi possível gerar a prova para o candidato.' });
  }
});

// GET /api/theoretical-test/:candidateId - Buscar prova em andamento do candidato
app.get('/api/theoretical-test/:candidateId', async (req: Request, res: Response) => {
  const { candidateId } = req.params;

  try {
    const { results } = await baserowServer.get(
      PROVAS_TEORICAS_APLICADAS_TABLE_ID,
      `?filter__candidato_id=${candidateId}&filter__status=em_andamento`
    );

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Nenhuma prova em andamento encontrada para este candidato.' });
    }

    const appliedTest = results[0];
    
    // Buscar o modelo da prova para obter as questões
    const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(appliedTest.modelo_prova_id));
    
    if (!model) {
      return res.status(404).json({ error: 'Modelo de prova não encontrado.' });
    }

    const questoes = JSON.parse(model.questoes || '[]');
    const questoesRespostas = JSON.parse(appliedTest.questoes_respostas || '[]');

    // Combinar questões com respostas (sem mostrar gabarito)
    const questoesParaCandidato = questoes.map((questao: Question) => {
      const resposta = questoesRespostas.find((qr: any) => qr.questao_id === questao.id);
      return {
        id: questao.id,
        tipo: questao.tipo,
        enunciado: questao.enunciado,
        opcoes: questao.opcoes || [],
        pontuacao: questao.pontuacao,
        resposta_candidato: resposta?.resposta || ''
      };
    });

    const testData = {
      id: appliedTest.id,
      modelo_nome: model.nome,
      modelo_descricao: model.descricao,
      tempo_limite: model.tempo_limite,
      tempo_restante: appliedTest.tempo_restante,
      questoes: questoesParaCandidato,
      status: appliedTest.status,
      data_inicio: appliedTest.data_inicio
    };

    res.json({ success: true, data: testData });
  } catch (error: unknown) {
    console.error('Erro ao buscar prova do candidato:', error);
    res.status(500).json({ error: 'Não foi possível buscar a prova do candidato.' });
  }
});

// PUT /api/theoretical-test/:testId/submit - Submeter respostas da prova
app.put('/api/theoretical-test/:testId/submit', async (req: Request, res: Response) => {
  const { testId } = req.params;
  const { respostas }: { respostas: { questao_id: string; resposta: string }[] } = req.body;

  if (!respostas || !Array.isArray(respostas)) {
    return res.status(400).json({ error: 'Respostas são obrigatórias.' });
  }

  try {
    // Buscar a prova aplicada
    const appliedTest = await baserowServer.getRow(PROVAS_TEORICAS_APLICADAS_TABLE_ID, parseInt(testId));
    if (!appliedTest) {
      return res.status(404).json({ error: 'Prova não encontrada.' });
    }

    if (appliedTest.status !== 'em_andamento') {
      return res.status(400).json({ error: 'Esta prova não está mais em andamento.' });
    }

    // Buscar o modelo para calcular pontuação
    const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(appliedTest.modelo_prova_id));
    if (!model) {
      return res.status(404).json({ error: 'Modelo de prova não encontrado.' });
    }

    const questoes = JSON.parse(model.questoes || '[]');
    let pontuacaoTotal = 0;

    // Calcular pontuação para cada resposta
    const questoesRespostasAtualizadas = respostas.map(resposta => {
      const questao = questoes.find((q: Question) => q.id === resposta.questao_id);
      let pontuacaoObtida = 0;

      if (questao && questao.tipo !== 'dissertativa') {
        // Para questões objetivas, comparar com gabarito
        if (resposta.resposta === questao.resposta_correta) {
          pontuacaoObtida = questao.pontuacao;
        }
      } else if (questao && questao.tipo === 'dissertativa') {
        // Para dissertativas, pontuação será definida manualmente pelo recrutador
        pontuacaoObtida = 0; // Será atualizada posteriormente
      }

      pontuacaoTotal += pontuacaoObtida;

      return {
        questao_id: resposta.questao_id,
        resposta: resposta.resposta,
        pontuacao_obtida: pontuacaoObtida
      };
    });

    // Atualizar prova com respostas e status finalizado
    const updateData = {
      questoes_respostas: JSON.stringify(questoesRespostasAtualizadas),
      pontuacao_total: pontuacaoTotal,
      status: 'finalizada',
      data_finalizacao: new Date().toISOString(),
      tempo_restante: 0
    };

    const updatedTest = await baserowServer.patch(PROVAS_TEORICAS_APLICADAS_TABLE_ID, parseInt(testId), updateData);

    // Enviar notificação de prova finalizada via N8N
    if (N8N_THEORETICAL_WEBHOOK_URL) {
      try {
        const candidate = await baserowServer.getRow(CANDIDATOS_TABLE_ID, parseInt(appliedTest.candidato_id));
        await fetch(N8N_THEORETICAL_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'prova_finalizada',
            candidato: {
              id: candidate.id,
              nome: candidate.nome,
              email: candidate.email
            },
            prova: {
              id: updatedTest.id,
              nome_modelo: model.nome,
              pontuacao_total: pontuacaoTotal,
              data_finalizacao: updateData.data_finalizacao
            }
          })
        });
      } catch (webhookError) {
        console.error('Erro ao enviar webhook de prova finalizada:', webhookError);
      }
    }

    res.json({ 
      success: true, 
      message: 'Prova submetida com sucesso.',
      pontuacao_total: pontuacaoTotal
    });
  } catch (error: unknown) {
    console.error('Erro ao submeter prova:', error);
    res.status(500).json({ error: 'Não foi possível submeter a prova.' });
  }
});

// GET /api/theoretical-test/results/:candidateId - Buscar resultados das provas do candidato
app.get('/api/theoretical-test/results/:candidateId', async (req: Request, res: Response) => {
  const { candidateId } = req.params;

  try {
    const { results } = await baserowServer.get(
      PROVAS_TEORICAS_APLICADAS_TABLE_ID,
      `?filter__candidato_id=${candidateId}&order_by=-data_finalizacao`
    );

    if (!results || results.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const formattedResults = await Promise.all(results.map(async (test: any) => {
      // Buscar modelo para obter nome
      const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(test.modelo_prova_id));
      
      return {
        id: test.id,
        modelo_nome: model?.nome || 'Modelo não encontrado',
        pontuacao_total: test.pontuacao_total,
        status: test.status,
        data_inicio: test.data_inicio,
        data_finalizacao: test.data_finalizacao,
        tempo_restante: test.tempo_restante
      };
    }));

    res.json({ success: true, data: formattedResults });
  } catch (error: unknown) {
    console.error('Erro ao buscar resultados das provas:', error);
    res.status(500).json({ error: 'Não foi possível buscar os resultados das provas.' });
  }
});


app.listen(port, () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 🔍 DIAGNÓSTICO: Verificar se as variáveis estão sendo carregadas
  console.log('\n=== DIAGNÓSTICO DE VARIÁVEIS ===');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
  console.log(`BACKEND_URL: ${process.env.BACKEND_URL}`);
  console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'DEFINIDO' : 'NÃO DEFINIDO'}`);
  console.log(`VITE_BASEROW_API_KEY: ${process.env.VITE_BASEROW_API_KEY ? 'DEFINIDO' : 'NÃO DEFINIDO'}`);
  console.log('================================\n');
  
  console.log(`🚀 Backend rodando em ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
  console.log(`📡 Porta: ${port}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 Backend URL: ${process.env.BACKEND_URL || `http://localhost:${port}`}`);
  console.log(`🗄️  Baserow API: ${process.env.VITE_BASEROW_API_KEY ? 'Configurado' : 'NÃO CONFIGURADO'}`);
  console.log(`🤖 N8N Webhooks: ${process.env.TESTE_COMPORTAMENTAL_WEBHOOK_URL ? 'Configurado' : 'NÃO CONFIGURADO'}`);
  console.log('✅ Servidor pronto para receber requisições!');
});