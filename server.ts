// Caminho: server.ts
// SUBSTITUA O CONTEÚDO INTEIRO DESTE ARQUIVO

import dotenv from 'dotenv';

// Detecta o ambiente (default: development)
const NODE_ENV = process.env.NODE_ENV || 'development';
console.log(`[ENV] Carregando configurações para ambiente: ${NODE_ENV}`);

// Carrega primeiro o .env padrão
const defaultEnvResult = dotenv.config({ path: '.env' });
console.log(`[ENV] .env carregado:`, defaultEnvResult.error ? 'ERRO' : 'OK');

// Depois carrega o específico do ambiente, sobrescrevendo se necessário
const envSpecificResult = dotenv.config({ path: `.env.${NODE_ENV}`, override: true });
console.log(`[ENV] .env.${NODE_ENV} carregado:`, envSpecificResult.error ? 'ERRO' : 'OK');

import express, { Request, Response } from 'express';
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
  dificuldade?: 'facil' | 'media' | 'dificil'; // Campo para controle de tempo
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

// Configuração simplificada de CORS para produção
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`[CORS] Request from origin: ${origin}, Method: ${req.method}, Path: ${req.path}`);
  
  // Lista de origens permitidas
  const allowedOrigins = [
    'https://recrutamentoia.com.br',
    'https://www.recrutamentoia.com.br',
    'https://backend.recrutamentoia.com.br'
  ];
  
  // Em desenvolvimento, permite qualquer origem
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } 
  // Em produção, verifica a lista de origens ou usa a origem da requisição se estiver na lista
  else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } 
  // Fallback para o domínio principal
  else {
    res.setHeader('Access-Control-Allow-Origin', 'https://recrutamentoia.com.br');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
  
  // Manipular requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS preflight request');
    res.status(204).send();
    return;
  }
  
  next();
});

// Configurações de segurança para produção
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', process.env.TRUST_PROXY === 'true');
}

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Endpoint de teste para verificar CORS
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cors: 'working',
    environment: process.env.NODE_ENV 
  });
});

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

// 🚀 SISTEMA DE CACHE para Google Calendar Events
interface CacheEntry {
  data: any;
  timestamp: number;
  userId: string;
}

const googleCalendarCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 1000; // 30 segundos TTL

// Função para limpar cache expirado
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, entry] of googleCalendarCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      googleCalendarCache.delete(key);
      console.log(`[CACHE] Removida entrada expirada: ${key}`);
    }
  }
};

// Limpar cache automaticamente a cada 60 segundos
setInterval(cleanExpiredCache, 60 * 1000);

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
  console.log('[POST /api/jobs] === INICIO DA REQUISIÇÃO ===');
  console.log('[POST /api/jobs] Body recebido:', JSON.stringify(req.body, null, 2));
  
  const { titulo, descricao, endereco, requisitos_obrigatorios, requisitos_desejaveis, usuario } = req.body;
  
  console.log('[POST /api/jobs] Campos extraídos:');
  console.log('[POST /api/jobs] - titulo:', titulo);
  console.log('[POST /api/jobs] - descricao:', descricao);
  console.log('[POST /api/jobs] - usuario:', usuario);
  console.log('[POST /api/jobs] - typeof usuario:', typeof usuario);
  console.log('[POST /api/jobs] - Array.isArray(usuario):', Array.isArray(usuario));
  console.log('[POST /api/jobs] - usuario.length:', usuario?.length);
  
  if (!titulo || !descricao || !usuario || usuario.length === 0) {
    console.log('[POST /api/jobs] ERRO: Validação falhou');
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
    'Triagem', 'Entrevista por Vídeo', 'Teste Teórico', 'Entrevista Presencial',
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

// Rota genérica para atualizar dados de candidato
app.patch('/api/candidates/:candidateId', async (req: Request, res: Response) => {
    const { candidateId } = req.params;
    const updateData = req.body;

    try {
        console.log(`[PATCH] Tentando atualizar candidato ID: ${candidateId}`, updateData);

        // Usar o cliente Baserow para atualizar o candidato
        const result = await baserowServer.patch(CANDIDATOS_TABLE_ID, parseInt(candidateId), updateData);

        console.log(`[PATCH] Candidato atualizado com sucesso:`, result);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error(`[PATCH] Erro ao atualizar candidato ${candidateId}:`, error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao atualizar candidato',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// Rota para excluir candidato do banco de talentos
app.delete('/api/candidates/:candidateId', async (req: Request, res: Response) => {
    const { candidateId } = req.params;

    try {
        console.log(`[DELETE] Tentando excluir candidato ID: ${candidateId}`);

        // Usar o cliente Baserow para deletar o candidato
        await baserowServer.delete(CANDIDATOS_TABLE_ID, parseInt(candidateId));

        console.log(`[DELETE] Candidato ${candidateId} excluído com sucesso`);
        res.status(200).json({ message: 'Candidato excluído com sucesso!' });

    } catch (error: any) {
        console.error('[DELETE] Erro ao excluir candidato:', error.message);
        res.status(500).json({ error: 'Falha ao excluir candidato.' });
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

  // 🔧 ESCOPO AMPLIADO para melhor compatibilidade
  const scopes = ['https://www.googleapis.com/auth/calendar'];

  // Para desenvolvimento local, usar configuração específica
  const isDevelopment = process.env.NODE_ENV === 'development';
  console.log('[Google Auth Connect] Ambiente:', isDevelopment ? 'desenvolvimento' : 'produção');
  console.log('[Google Auth Connect] GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: userId.toString(),
    include_granted_scopes: true, // 🔧 Melhor compatibilidade
  });

  console.log('[Google Auth Connect] URL gerada:', url);
  res.json({ url });
});

// 🔄 ENDPOINT: SINCRONIZAÇÃO FORÇADA TOTAL
app.post('/api/google/calendar/force-sync/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    console.log(`[FORCE SYNC] 🔄 Iniciando sincronização TOTAL para userId: ${userId}`);
    
    // Buscar usuário e tokens
    const userRow = await baserowServer.get(USERS_TABLE_ID, userId);
    const refreshToken = userRow.google_refresh_token;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Google Calendar não conectado',
        success: false
      });
    }
    
    // Configurar cliente OAuth2
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // 🎯 SINCRONIZAÇÃO AGRESSIVA: Buscar MUITO mais eventos
    const timeMin = new Date();
    timeMin.setMonth(timeMin.getMonth() - 6); // 6 meses atrás
    
    const timeMax = new Date();
    timeMax.setMonth(timeMax.getMonth() + 12); // 12 meses à frente
    
    console.log(`[FORCE SYNC] 📅 Período TOTAL:`, {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString()
    });
    
    // 🔧 PAGINAÇÃO CORRETA: maxResults máximo 2500
    const allEvents: any[] = [];
    let pageToken: string | undefined;
    
    do {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500, // Máximo permitido pela API
        pageToken
      });
      
      const events = response.data.items || [];
      allEvents.push(...events);
      pageToken = response.data.nextPageToken || undefined;
      
      console.log(`[FORCE SYNC] 📄 Página carregada: ${events.length} eventos (total: ${allEvents.length})`);
      
    } while (pageToken);
    
    console.log(`[FORCE SYNC] 📊 TOTAL de eventos encontrados: ${allEvents.length}`);
    const events = allEvents;
    
    // Log dos primeiros eventos para debug
    if (events.length > 0) {
      console.log(`[FORCE SYNC] 🔍 PRIMEIROS 5 EVENTOS:`);
      events.slice(0, 5).forEach((event: any, i: number) => {
        console.log(`[${i+1}]`, {
          summary: event.summary || '⚠️ SEM TÍTULO',
          start: event.start?.dateTime || event.start?.date,
          hasAttendees: !!event.attendees?.length,
          hasLocation: !!event.location,
          hasDescription: !!event.description
        });
      });
    }
    
    res.json({
      success: true,
      message: `Sincronização forçada concluída`,
      totalEvents: events.length,
      timeRange: {
        from: timeMin.toISOString(),
        to: timeMax.toISOString()
      },
      sampleEvents: events.slice(0, 3).map((event: any) => ({
        id: event.id,
        title: event.summary || `📅 Compromisso ${event.start?.dateTime || event.start?.date}`,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date
      }))
    });
    
  } catch (error: any) {
    // 🚨 LOGS DETALHADOS para force sync
    console.error('[FORCE SYNC] ❌ ERRO DETALHADO:', {
      message: error.message,
      statusCode: error?.response?.status,
      statusText: error?.response?.statusText,
      responseData: error?.response?.data,
      errorCode: error?.code
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Erro na sincronização forçada',
      details: error?.response?.data || error.message,
      statusCode: error?.response?.status
    });
  }
});

// 🎯 ENDPOINT: Detectar disponibilidade para entrevistas
app.get('/api/google/availability/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { date, duration = 60 } = req.query; // duração em minutos, padrão 1h
  
  try {
    console.log(`[AVAILABILITY] Verificando disponibilidade para userId: ${userId}`);
    
    // Buscar usuário e refresh token
    const userRow = await baserowServer.get(USERS_TABLE_ID, userId);
    const refreshToken = userRow.google_refresh_token;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Google Calendar não conectado',
        availableSlots: []
      });
    }
    
    // Configurar OAuth2 client
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Definir período de busca (dia específico ou próximos 7 dias)
    const searchDate = date ? new Date(date as string) : new Date();
    const timeMin = new Date(searchDate);
    timeMin.setHours(8, 0, 0, 0); // 8:00 AM
    
    const timeMax = new Date(searchDate);
    timeMax.setHours(18, 0, 0, 0); // 6:00 PM
    
    console.log(`[AVAILABILITY] Buscando eventos entre: ${timeMin.toISOString()} e ${timeMax.toISOString()}`);
    
    // Buscar eventos do dia
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    const events = response.data.items || [];
    const busySlots = events
      .filter((event: any) => event.start?.dateTime && event.end?.dateTime)
      .map((event: any) => ({
        start: new Date(event.start.dateTime),
        end: new Date(event.end.dateTime),
        title: event.summary || 'Ocupado'
      }));
    
    // Gerar slots disponíveis
    const availableSlots = [];
    const slotDuration = parseInt(duration as string);
    let currentTime = new Date(timeMin);
    
    while (currentTime < timeMax) {
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60 * 1000);
      
      // Verificar se o slot não conflita com eventos existentes
      const hasConflict = busySlots.some(busy => 
        (currentTime >= busy.start && currentTime < busy.end) ||
        (slotEnd > busy.start && slotEnd <= busy.end) ||
        (currentTime <= busy.start && slotEnd >= busy.end)
      );
      
      if (!hasConflict && slotEnd <= timeMax) {
        availableSlots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd),
          duration: slotDuration,
          timeLabel: currentTime.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
          })
        });
      }
      
      // Avançar 30 minutos
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }
    
    console.log(`[AVAILABILITY] Encontrados ${availableSlots.length} slots disponíveis`);
    
    res.json({
      success: true,
      date: searchDate.toISOString().split('T')[0],
      busySlots,
      availableSlots,
      suggestions: availableSlots.slice(0, 6) // Top 6 sugestões
    });
    
  } catch (error: any) {
    console.error('[AVAILABILITY] Erro:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar disponibilidade',
      availableSlots: []
    });
  }
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

// Endpoint de debug detalhado
app.get('/api/google/auth/debug/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    console.log(`[DEBUG] Verificando usuário ${userId}...`);
    const userResponse = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId));
    
    const debugInfo: any = {
      userId: parseInt(userId),
      hasRefreshToken: !!userResponse.google_refresh_token,
      refreshTokenPreview: userResponse.google_refresh_token ? 
        `${userResponse.google_refresh_token.substring(0, 10)}...` : null,
      userEmail: userResponse.email || 'N/A',
      userName: userResponse.name || 'N/A',
      lastUpdated: userResponse.updated_on || 'N/A'
    };
    
    // Testar se o token funciona
    if (userResponse.google_refresh_token) {
      try {
        oauth2Client.setCredentials({ refresh_token: userResponse.google_refresh_token });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const testResponse = await calendar.events.list({
          calendarId: 'primary',
          maxResults: 1,
          timeMin: new Date().toISOString()
        });
        
        debugInfo.tokenTest = {
          status: 'válido',
          canAccessCalendar: true,
          testEventCount: testResponse.data.items?.length || 0
        };
      } catch (tokenError: any) {
        debugInfo.tokenTest = {
          status: 'inválido',
          canAccessCalendar: false,
          error: tokenError.message
        };
      }
    }
    
    console.log(`[DEBUG] Info do usuário ${userId}:`, debugInfo);
    res.json(debugInfo);
    
  } catch (error: any) {
    console.error(`[DEBUG] Erro ao verificar usuário ${userId}:`, error);
    res.status(500).json({ error: 'Erro ao verificar usuário', details: error.message });
  }
});

app.post('/api/google/calendar/create-event', async (req: Request, res: Response) => {
  console.log('[DEBUG] =========================');
  console.log('[DEBUG] Nova requisição de criação de evento');
  console.log('[DEBUG] Body recebido:', JSON.stringify(req.body, null, 2));
  
  const { userId, eventData, candidate, job } = req.body;
  if (!userId || !eventData || !candidate || !job) {
    console.log('[DEBUG] ❌ Dados insuficientes:', { userId: !!userId, eventData: !!eventData, candidate: !!candidate, job: !!job });
    return res.status(400).json({ success: false, message: 'Dados insuficientes.' });
  }

  try {
    console.log('[DEBUG] 🔍 Buscando usuário ID:', userId);
    const userResponse = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId));
    console.log('[DEBUG] 👤 Usuário encontrado:', userResponse.nome);
    
    const refreshToken = userResponse.google_refresh_token;
    console.log('[DEBUG] 🔑 Refresh token presente:', !!refreshToken);
    
    if (!refreshToken) {
      console.log('[DEBUG] ❌ Usuário não tem refresh token');
      return res.status(401).json({ success: false, message: 'Usuário não conectado ao Google Calendar. Por favor, conecte sua conta em "Configurações".' });
    }

    console.log('[DEBUG] 🔧 Configurando OAuth2 client...');
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // SIMPLIFICADO: Apenas informações básicas no Google Calendar
    console.log('[DEBUG] 📅 Dados recebidos - start:', eventData.start, 'end:', eventData.end);
    
    // Corrigir formato de data se necessário
    const startDate = new Date(eventData.start);
    const endDate = new Date(eventData.end);
    
    console.log('[DEBUG] 📅 Datas convertidas - start:', startDate.toISOString(), 'end:', endDate.toISOString());
    
    const event = {
      summary: `Entrevista - ${candidate.nome}`,
      description: `Entrevista com ${candidate.nome} para a vaga: ${job.titulo}`,
      start: { 
        dateTime: startDate.toISOString(),
        timeZone: 'America/Sao_Paulo' 
      },
      end: { 
        dateTime: endDate.toISOString(),
        timeZone: 'America/Sao_Paulo' 
      },
      reminders: { 
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 }
        ]
      },
      // Forçar visibilidade
      visibility: 'default',
      // Adicionar localização se disponível
      location: 'Entrevista Online'
    };

    console.log('[DEBUG] 📅 Criando evento no Google Calendar...');
    console.log('[DEBUG] 📝 Dados do evento:', JSON.stringify(event, null, 2));
    
    // Verificar acesso ao calendário antes de criar
    try {
      const calendarList = await calendar.calendarList.list();
      console.log('[DEBUG] 📋 Calendários disponíveis:', calendarList.data.items?.length);
      
      const primaryCalendar = calendarList.data.items?.find(cal => cal.id === 'primary');
      console.log('[DEBUG] 📋 Calendário primário encontrado:', !!primaryCalendar);
      console.log('[DEBUG] 📋 Acesso de escrita:', primaryCalendar?.accessRole);
    } catch (calError) {
      console.error('[DEBUG] ❌ Erro ao verificar calendários:', calError);
    }
    
    const response = await calendar.events.insert({
      calendarId: 'primary', 
      requestBody: event,
      sendNotifications: true // Enviar notificações
    });

    console.log('[DEBUG] ✅ Evento criado com sucesso!');
    console.log('[DEBUG] 🆔 ID do evento:', response.data.id);
    console.log('[DEBUG] 🔗 Link do evento:', response.data.htmlLink);
    console.log('[DEBUG] 📊 Status da resposta:', response.status);
    console.log('[DEBUG] 📅 Data/hora do evento criado:', response.data.start?.dateTime);

    // Verificar se o evento foi realmente criado fazendo uma busca
    try {
      console.log('[DEBUG] 🔍 Verificando se evento foi criado...');
      const createdEvent = await calendar.events.get({
        calendarId: 'primary',
        eventId: response.data.id!
      });
      console.log('[DEBUG] ✅ Evento confirmado no Google Calendar:', createdEvent.data.summary);
      console.log('[DEBUG] 📅 Horário confirmado:', createdEvent.data.start?.dateTime);
    } catch (verifyError) {
      console.error('[DEBUG] ❌ Erro ao verificar evento criado:', verifyError);
    }

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
    res.json({ 
      success: true, 
      message: 'Evento criado com sucesso!', 
      data: {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        summary: response.data.summary,
        start: response.data.start,
        end: response.data.end
      }
    });
  } catch (error: any) {
    console.error('Erro ao criar evento no Google Calendar:', error);
    res.status(500).json({ success: false, message: 'Falha ao criar evento.' });
  }
});

// Endpoint para verificar um evento específico
app.get('/api/google/calendar/event/:userId/:eventId', async (req: Request, res: Response) => {
  const { userId, eventId } = req.params;
  
  try {
    const userResponse = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId));
    const refreshToken = userResponse.google_refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Usuário não conectado ao Google Calendar.' });
    }

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId
    });
    
    res.json({ 
      success: true, 
      event: {
        id: event.data.id,
        summary: event.data.summary,
        description: event.data.description,
        start: event.data.start,
        end: event.data.end,
        htmlLink: event.data.htmlLink
      }
    });
  } catch (error) {
    console.error('Erro ao buscar evento específico:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar evento.' });
  }
});

// Endpoint para listar eventos do Google Calendar sincronizados
app.get('/api/google/calendar/events/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const cacheKey = `google_events_${userId}`;
  
  console.log(`[GOOGLE CALENDAR] 🚀 Buscando eventos para userId: ${userId}`);
  
  // 🎯 VERIFICAR CACHE PRIMEIRO
  const cachedEntry = googleCalendarCache.get(cacheKey);
  if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
    console.log(`[CACHE] ✅ HIT! Retornando ${cachedEntry.data.length} eventos em cache (${Math.round((Date.now() - cachedEntry.timestamp) / 1000)}s atrás)`);
    return res.json({ success: true, events: cachedEntry.data, cached: true });
  }
  
  console.log(`[CACHE] ❌ MISS. Buscando na API do Google...`);
  
  try {
    console.log(`[GOOGLE CALENDAR] Fazendo busca do usuário na tabela ${USERS_TABLE_ID}`);
    const userResponse = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId));
    console.log(`[GOOGLE CALENDAR] Resposta do usuário:`, userResponse);
    
    const refreshToken = userResponse.google_refresh_token;
    console.log(`[GOOGLE CALENDAR] Refresh token presente:`, !!refreshToken);
    
    if (!refreshToken) {
      console.log(`[GOOGLE CALENDAR] Usuário ${userId} não tem refresh token`);
      return res.status(401).json({ success: false, message: 'Usuário não conectado ao Google Calendar.' });
    }

    console.log(`[GOOGLE CALENDAR] Configurando OAuth2 client com refresh token`);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // 🎯 PERÍODO COMPLETO: Buscar TODOS os eventos (passado + presente + futuro)
    const timeMin = new Date('2025-09-01T00:00:00Z'); // Todo setembro 2025
    const timeMax = new Date('2026-01-01T00:00:00Z'); // Até janeiro 2026
    
    console.log(`[GOOGLE CALENDAR] 🎯 PERÍODO COMPLETO - Todo setembro 2025:`, {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      hoje: new Date().toISOString(),
      buscandoTodos: 'SIM - incluindo calendários compartilhados'
    });
    
    // 🔄 BUSCA EM MÚLTIPLOS CALENDÁRIOS
    const allEvents: any[] = [];
    
    // 1. Buscar lista de calendários do usuário
    const calendarList = await calendar.calendarList.list({
      maxResults: 250
    });
    
    const calendars = calendarList.data.items || [];
    console.log(`[GOOGLE CALENDAR] 📅 Calendários encontrados: ${calendars.length}`);
    
    // 2. Buscar eventos em cada calendário
    for (const cal of calendars) {
      if (!cal.id) continue;
      
      console.log(`[GOOGLE CALENDAR] 🔍 Buscando em: ${cal.summary} (${cal.id})`);
      
      let pageToken: string | undefined;
      let calendarEvents = 0;
      
      do {
        const response = await calendar.events.list({
          calendarId: cal.id,
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 2500,
          pageToken
        });
        
        const pageEvents = response.data.items || [];
        allEvents.push(...pageEvents);
        calendarEvents += pageEvents.length;
        pageToken = response.data.nextPageToken || undefined;
        
      } while (pageToken);
      
      console.log(`[GOOGLE CALENDAR] ✅ ${cal.summary}: ${calendarEvents} eventos`);
    }

    console.log(`[GOOGLE CALENDAR] Response da API Google:`, {
      status: 200,
      itemsCount: allEvents.length
    });

    const events = allEvents;
    
    // 🔍 DEBUG COMPLETO: Todos os campos dos eventos Google
    if (events.length > 0) {
      console.log(`[GOOGLE CALENDAR] 🔍 PRIMEIRO EVENTO COMPLETO:`, JSON.stringify(events[0], null, 2));
      
      console.log(`[GOOGLE CALENDAR] 📊 RESUMO DOS PRIMEIROS 3 EVENTOS:`);
      events.slice(0, 3).forEach((event: any, index: number) => {
        console.log(`[EVENTO ${index + 1}]`, {
          id: event.id,
          summary: event.summary || 'UNDEFINED',
          description: event.description || 'UNDEFINED',
          location: event.location || 'UNDEFINED',
          start: event.start,
          end: event.end,
          status: event.status,
          attendees: event.attendees?.length || 0,
          creator: event.creator?.email || 'UNDEFINED',
          organizer: event.organizer?.email || 'UNDEFINED'
        });
      });
    } else {
      console.log(`[GOOGLE CALENDAR] ⚠️  Nenhum evento retornado pela API Google!`);
    }
    // Filtrar eventos válidos do Google Calendar
    const validEvents = events.filter((event: any) => {
      const isNotCancelled = event.status !== 'cancelled';
      const hasDateTime = event.start && (event.start.dateTime || event.start.date);
      
      // ✅ FILTRO CORRIGIDO: Aceitar todos os eventos com horário válido
      // Eventos do Google Calendar são sempre válidos se têm data/hora
      return isNotCancelled && hasDateTime;
    });
    
    console.log(`[GOOGLE CALENDAR] Eventos válidos após filtro: ${validEvents.length} de ${events.length}`);
    
    // 🔄 FORMATAÇÃO COMPLETA dos eventos Google Calendar
    const formattedEvents = validEvents.map((event: any) => {
      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;
      
      // 🎯 TÍTULO REAL DO GOOGLE CALENDAR
      let eventTitle = event.summary || null;
      
      // Se não tem título, criar um descritivo
      if (!eventTitle || eventTitle.trim() === '') {
        const startDate = new Date(startTime);
        const timeStr = startDate.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });
        
        if (event.location && event.location.trim() !== '') {
          eventTitle = `📍 ${event.location.trim()}`;
        } else if (event.attendees && event.attendees.length > 0) {
          eventTitle = `👥 Reunião (${event.attendees.length} pessoas)`;
        } else if (event.description && event.description.trim() !== '') {
          const desc = event.description.trim().substring(0, 40);
          eventTitle = `📝 ${desc}`;
        } else {
          eventTitle = `📅 Compromisso ${timeStr}`;
        }
      }
      
      // 📊 LOG completo do evento formatado
      console.log(`[GOOGLE CALENDAR] ✅ Evento sincronizado:`, {
        id: event.id,
        title: eventTitle,
        originalSummary: event.summary || 'VAZIO',
        start: startTime,
        end: endTime,
        hasLocation: !!event.location,
        hasDescription: !!event.description,
        attendeesCount: event.attendees?.length || 0
      });
      
      // 🎯 OBJETO COMPLETO com TODOS os dados do Google Calendar
      return {
        id: event.id,
        title: eventTitle,
        description: event.description?.trim() || '',
        start: startTime,
        end: endTime,
        location: event.location?.trim() || '',
        attendees: event.attendees || [],
        htmlLink: event.htmlLink || '',
        creatorEmail: event.creator?.email || '',
        organizerEmail: event.organizer?.email || '',
        eventStatus: event.status || 'confirmed',
        colorId: event.colorId || '',
        createdAt: event.created || '',
        updatedAt: event.updated || '',
        status: event.status,
        // Adicionar informações extras para debug
        creator: event.creator?.email || '',
        organizer: event.organizer?.email || ''
      };
    });

    console.log(`[GOOGLE CALENDAR] Retornando ${formattedEvents.length} eventos formatados`);
    
    // 🚀 SALVAR NO CACHE para próximas requisições
    googleCalendarCache.set(cacheKey, {
      data: formattedEvents,
      timestamp: Date.now(),
      userId: userId
    });
    console.log(`[CACHE] ✅ SALVOU ${formattedEvents.length} eventos no cache (TTL: ${CACHE_TTL/1000}s)`);
    
    res.json({ success: true, events: formattedEvents, cached: false });
  } catch (error: any) {
    // 🚨 LOGS DETALHADOS para diagnóstico completo
    console.error(`[GOOGLE CALENDAR] ❌ ERRO DETALHADO para userId ${userId}:`, {
      message: error.message,
      statusCode: error?.response?.status,
      statusText: error?.response?.statusText,
      responseData: error?.response?.data,
      errorCode: error?.code,
      stack: error?.stack?.split('\n').slice(0, 3) // Primeiras linhas do stack
    });
    
    // Tratamento específico de erros do Google API
    if (error.code === 401 || error.message?.includes('unauthorized') || error.message?.includes('invalid_grant')) {
      console.log(`[GOOGLE CALENDAR] 🔑 Token expirado ou inválido para userId ${userId}`);
      res.status(401).json({ 
        success: false, 
        message: 'Token do Google expirado. Por favor, reconecte sua conta Google.',
        error_code: 'TOKEN_EXPIRED'
      });
    } else if (error.code === 403) {
      console.log(`[GOOGLE CALENDAR] Acesso negado para userId ${userId}`);
      res.status(403).json({ 
        success: false, 
        message: 'Acesso negado ao Google Calendar. Verifique as permissões.',
        error_code: 'ACCESS_DENIED'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Falha ao buscar eventos do Google Calendar.',
        error_code: 'UNKNOWN_ERROR',
        details: error.message
      });
    }
  }
});

// Endpoint para atualizar evento do Google Calendar
app.put('/api/google/calendar/events/:eventId', async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { userId, eventData } = req.body;
  
  try {
    const userResponse = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId));
    const refreshToken = userResponse.google_refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Usuário não conectado ao Google Calendar.' });
    }

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: eventData.title,
      description: eventData.description || eventData.details,
      start: { dateTime: eventData.start, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: eventData.end, timeZone: 'America/Sao_Paulo' },
      location: eventData.location || '',
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: event,
    });

    res.json({ success: true, message: 'Evento atualizado com sucesso!', data: response.data });
  } catch (error: any) {
    console.error('Erro ao atualizar evento no Google Calendar:', error);
    res.status(500).json({ success: false, message: 'Falha ao atualizar evento.' });
  }
});

// Endpoint para deletar evento do Google Calendar
app.delete('/api/google/calendar/events/:eventId', async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { userId } = req.query;
  
  try {
    const userResponse = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId as string));
    const refreshToken = userResponse.google_refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Usuário não conectado ao Google Calendar.' });
    }

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    res.json({ success: true, message: 'Evento excluído com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao excluir evento no Google Calendar:', error);
    res.status(500).json({ success: false, message: 'Falha ao excluir evento.' });
  }
});

// Endpoint público para listar modelos de prova teórica (com filtro por usuário)
app.get('/api/public/theoretical-models', async (req: Request, res: Response) => {
  try {
    // Pegar o ID do usuário dos headers
    const userId = req.headers['x-user-id'] || req.query.userId || '1';
    
    console.log('🔍 [Public] Buscando modelos para usuário:', userId);
    console.log('🔍 [Public] Buscando modelos na tabela:', PROVAS_TEORICAS_MODELOS_TABLE_ID);
    const response = await baserowServer.get(PROVAS_TEORICAS_MODELOS_TABLE_ID);
    
    if (!response.results || !Array.isArray(response.results)) {
      console.log('⚠️ Nenhum resultado encontrado ou formato inválido');
      return res.json({ success: true, data: [] });
    }

    // Filtrar modelos por usuário (isolamento SaaS) - versão mais permissiva para debug
    const filteredResults = response.results.filter((model: any) => {
      // 🎯 PRIMEIRO: Só modelos ATIVOS
      if (!model.ativo) {
        console.log(`❌ Modelo ${model.id} INATIVO - ignorando`);
        return false;
      }

      // 🔍 SEGUNDO: Verificar propriedade do modelo
      let modelOwner = model.criado_por;
      
      console.log(`🔎 DEBUG modelo ${model.id}: criado_por raw=`, JSON.stringify(modelOwner));
      
      // Se criado_por é um array (relacionamento do Baserow), pegar o primeiro
      if (Array.isArray(modelOwner) && modelOwner.length > 0) {
        modelOwner = modelOwner[0].id || modelOwner[0].value || modelOwner[0];
      }
      // Se criado_por é um objeto, extrair o ID
      else if (typeof modelOwner === 'object' && modelOwner !== null) {
        modelOwner = modelOwner.id || modelOwner.value || 1;
      }
      
      // Default para usuário 1 se não tem proprietário definido
      if (!modelOwner || modelOwner === '') {
        modelOwner = 1;
      }
      
      console.log(`🔎 DEBUG modelo ${model.id}: criado_por final=${modelOwner}`);
      
      console.log(`🔍 Modelo ${model.id}: criado_por=${modelOwner}, userId=${userId}, ativo=${model.ativo}`);
      
      // 🎯 LÓGICA CORRIGIDA: Usuário 2 é SUPER ADMIN mas só vê suas próprias provas
      // Usuário 2 (SUPER ADMIN/Template Creator): Vê apenas SEUS próprios modelos
      if (String(userId) === '2') {
        const canAccess = String(modelOwner) === '2';
        console.log(`👑 SUPER ADMIN (User 2) - Modelo ${model.id}: canAccess=${canAccess} (só próprios modelos)`);
        return canAccess;
      }
      
      // Outros usuários veem seus próprios modelos + templates do usuário 2 (SUPER ADMIN)
      const canAccess = String(modelOwner) === String(userId) || String(modelOwner) === '2';
      console.log(`🔍 Modelo ${model.id}: canAccess=${canAccess} (próprios + templates User 2)`);
      return canAccess;
    });

    const models = filteredResults.map((model: any) => {      
      let questoes = [];
      try {
        questoes = model.perguntas ? JSON.parse(model.perguntas) : [];
      } catch (parseError) {
        console.error('Erro ao processar JSON das questões:', parseError);
        questoes = [];
      }

      return {
        id: model.id,
        nome: model.titulo, // Mapear titulo para nome para compatibilidade com frontend
        titulo: model.titulo,
        descricao: model.descricao,
        ativo: model.ativo,
        tempo_limite: model.tempo_limite,
        total_questoes: questoes.length,
        questoes: questoes
      };
    });

    console.log('✅ Modelos processados:', models.length);
    res.json({ success: true, data: models });
    
  } catch (error: any) {
    console.error('Erro ao buscar modelos de prova teórica:', error);
    res.status(500).json({ error: 'Erro ao carregar modelos de prova teórica.' });
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

// GET /api/public/theoretical-test/:testId - Endpoint público para acessar prova (similar ao comportamental)
app.get('/api/public/theoretical-test/:testId', async (req: Request, res: Response) => {
  const { testId } = req.params;
  
  if (!testId) {
    return res.status(400).json({ error: 'ID da prova é obrigatório.' });
  }
  
  try {
    console.log('[Public Theoretical Test] Buscando prova:', testId);
    
    // Buscar a prova aplicada
    const appliedTest = await baserowServer.getRow(PROVAS_TEORICAS_APLICADAS_TABLE_ID, parseInt(testId));
    if (!appliedTest) {
      return res.status(404).json({ error: 'Prova não encontrada.' });
    }
    
    console.log(`[Public Theoretical Test] Status da prova:`, appliedTest.status);
    console.log(`[Public Theoretical Test] Tipo do status:`, typeof appliedTest.status);
    
    // Verificar se a prova ainda está ativa (Concluído = finalizada)
    let isCompleted = false;
    
    if (typeof appliedTest.status === 'string' && appliedTest.status === 'Concluído') {
      isCompleted = true;
    } else if (appliedTest.status && typeof appliedTest.status === 'object' && appliedTest.status.value === 'Concluído') {
      isCompleted = true;
    }
    
    console.log(`[Public Theoretical Test] Prova já completada:`, isCompleted);
    
    if (isCompleted) {
      return res.status(400).json({ 
        error: 'Esta prova já foi respondida anteriormente e não pode ser feita novamente.',
        already_completed: true 
      });
    }
    
    // Buscar dados do candidato
    let candidateName = 'Candidato';
    if (appliedTest.candidato && appliedTest.candidato.length > 0) {
      try {
        const candidate = await baserowServer.getRow(CANDIDATOS_TABLE_ID, appliedTest.candidato[0].id);
        if (candidate) {
          candidateName = candidate.nome;
        }
      } catch (candidateError) {
        console.error('[Public Theoretical Test] Erro ao buscar candidato:', candidateError);
      }
    }
    
    // Buscar dados do modelo de prova
    let modelData = null;
    if (appliedTest.modelo_da_prova && appliedTest.modelo_da_prova.length > 0) {
      try {
        const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, appliedTest.modelo_da_prova[0].id);
        if (model) {
          modelData = {
            id: model.id,
            titulo: model.titulo,
            descricao: model.descricao,
            tempo_limite: model.tempo_limite,
            questoes: typeof model.perguntas === 'string' 
              ? JSON.parse(model.perguntas || '[]')
              : (Array.isArray(model.perguntas) ? model.perguntas : [])
          };
        }
      } catch (modelError) {
        console.error('[Public Theoretical Test] Erro ao buscar modelo:', modelError);
        return res.status(404).json({ error: 'Modelo da prova não encontrado.' });
      }
    }
    
    if (!modelData) {
      return res.status(404).json({ error: 'Modelo da prova não encontrado.' });
    }
    
    res.json({ 
      success: true, 
      data: { 
        id: appliedTest.id.toString(),
        candidato_nome: candidateName,
        modelo_prova: {
          nome: modelData.titulo,
          descricao: modelData.descricao,
          questoes: modelData.questoes
        },
        data_inicio: appliedTest.data_de_geracao
      } 
    });
  } catch (error: any) {
    console.error('[Public Theoretical Test] Erro:', error);
    res.status(500).json({ error: 'Não foi possível buscar os dados da prova.' });
  }
});

// PATCH /api/theoretical-test/submit - Submeter respostas da prova (similar ao comportamental)
app.patch('/api/theoretical-test/submit', async (req: Request, res: Response) => {
  console.log(`[Theoretical Test SUBMIT] === INICIO DA REQUISIÇÃO ===`);
  console.log(`[Theoretical Test SUBMIT] Headers:`, req.headers);
  console.log(`[Theoretical Test SUBMIT] Body:`, req.body);
  
  const { testId, responses } = req.body;
  
  console.log(`[Theoretical Test SUBMIT] Dados extraídos - testId: ${testId}, responses:`, responses);
  
  if (!testId || !responses) {
    console.log(`[Theoretical Test SUBMIT] ERRO: Dados obrigatórios faltando - testId: ${!!testId}, responses: ${!!responses}`);
    return res.status(400).json({ error: 'ID da prova e respostas são obrigatórios.' });
  }
  
  try {
    console.log(`[Theoretical Test SUBMIT] Iniciando busca da prova ${testId}`);
    console.log(`[Theoretical Test SUBMIT] Table ID: ${PROVAS_TEORICAS_APLICADAS_TABLE_ID}`);
    
    // Buscar a prova
    const appliedTest = await baserowServer.getRow(PROVAS_TEORICAS_APLICADAS_TABLE_ID, parseInt(testId));
    console.log(`[Theoretical Test SUBMIT] Resultado da busca:`, appliedTest ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
    
    if (!appliedTest) {
      console.log(`[Theoretical Test SUBMIT] ERRO: Prova ${testId} não encontrada no banco`);
      return res.status(404).json({ error: 'Prova não encontrada.' });
    }
    
    console.log(`[Theoretical Test] Prova encontrada:`, {
      id: appliedTest.id,
      status: appliedTest.status,
      modelo_da_prova: appliedTest.modelo_da_prova
    });
    
    // Verificar se ainda está ativa (Concluído = finalizada)
    if (appliedTest.status && (appliedTest.status.value === 'Concluído' || appliedTest.status === 'Concluído')) {
      return res.status(400).json({ 
        error: 'Esta prova já foi respondida anteriormente e não pode ser feita novamente.',
        already_completed: true 
      });
    }
    
    // Buscar modelo da prova para calcular pontuação
    let pontuacaoTotal = 0;
    
    if (appliedTest.modelo_da_prova && appliedTest.modelo_da_prova.length > 0) {
      try {
        console.log(`[Theoretical Test] Buscando modelo com ID:`, appliedTest.modelo_da_prova[0].id);
        const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, appliedTest.modelo_da_prova[0].id);
        console.log(`[Theoretical Test] Modelo encontrado:`, !!model);
        if (model && model.perguntas) {
          console.log(`[Theoretical Test] Tipo de perguntas:`, typeof model.perguntas);
          const questoes = typeof model.perguntas === 'string' 
            ? JSON.parse(model.perguntas) 
            : (Array.isArray(model.perguntas) ? model.perguntas : []);
          console.log(`[Theoretical Test] Número de questões:`, questoes.length);
          
          // Calcular pontuação para questões objetivas
          questoes.forEach((questao: any) => {
            if (questao.id && responses[questao.id]) {
              if (questao.tipo === 'verdadeiro_falso' || questao.tipo === 'multipla_escolha') {
                if (questao.resposta_correta && responses[questao.id] === questao.resposta_correta) {
                  pontuacaoTotal += questao.pontuacao || 1;
                }
              }
            }
          });
        }
      } catch (modelError) {
        console.error('[Theoretical Test] Erro ao buscar modelo para pontuação:', modelError);
      }
    }
    
    console.log(`[Theoretical Test SUBMIT] Preparando dados para atualização:`);
    console.log(`[Theoretical Test SUBMIT] - Pontuação total: ${pontuacaoTotal}`);
    console.log(`[Theoretical Test SUBMIT] - Responses JSON:`, JSON.stringify(responses));
    
    // Atualizar a prova com as respostas e pontuação
    console.log(`[Theoretical Test SUBMIT] Iniciando atualização da prova ${testId}`);
    
    console.log(`[Theoretical Test SUBMIT] Status atual da prova:`, appliedTest.status);
    
    // Agora atualizando para "Concluído" conforme opções do Baserow
    const updateData = {
      data_de_resposta: new Date().toISOString(),
      respostas_candidato: JSON.stringify(responses),
      pontuacao_total: pontuacaoTotal,
      status: 'Concluído', // Usar valor correto do Baserow
    };
    
    console.log(`[Theoretical Test SUBMIT] Dados de atualização:`, updateData);
    
    let updateResult;
    try {
      updateResult = await baserowServer.patch(PROVAS_TEORICAS_APLICADAS_TABLE_ID, parseInt(testId), updateData);
      console.log(`[Theoretical Test SUBMIT] Resultado da atualização:`, updateResult ? 'SUCESSO' : 'FALHA');
      console.log(`[Theoretical Test SUBMIT] Prova ${testId} submetida com sucesso`);
    } catch (updateError: unknown) {
      console.error(`[Theoretical Test SUBMIT] ERRO na atualização da prova:`, updateError);
      if (updateError instanceof Error) {
        console.error(`[Theoretical Test SUBMIT] Detalhes do erro:`, updateError.message);
        console.error(`[Theoretical Test SUBMIT] Stack trace:`, updateError.stack);
      }
      throw updateError; // Re-throw para ser capturado pelo catch principal
    }
    
    // Disparar webhook para N8N (se configurado)
    if (N8N_THEORETICAL_WEBHOOK_URL) {
      try {
        await fetch(N8N_THEORETICAL_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'prova_submetida',
            testId: parseInt(testId), 
            responses 
          }),
        });
        console.log(`[Theoretical Test SUBMIT] Webhook enviado para N8N`);
      } catch (webhookError) {
        console.error(`[Theoretical Test SUBMIT] Erro no webhook:`, webhookError);
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Prova submetida com sucesso! Obrigado por participar. Em breve entraremos em contato com o resultado.'
    });
  } catch (error: unknown) {
    console.error(`[Theoretical Test SUBMIT] === ERRO GERAL ===`);
    console.error(`[Theoretical Test SUBMIT] Erro ao submeter prova:`, error);
    if (error instanceof Error) {
      console.error(`[Theoretical Test SUBMIT] Mensagem do erro:`, error.message);
      console.error(`[Theoretical Test SUBMIT] Stack trace:`, error.stack);
    }
    console.error(`[Theoretical Test SUBMIT] === FIM ERRO ===`);
    res.status(500).json({ error: 'Erro ao submeter a prova.' });
  }
});

// DELETE /api/theoretical-test/cancel/:testId - Cancelar prova existente (similar ao comportamental)
app.delete('/api/theoretical-test/cancel/:testId', async (req: Request, res: Response) => {
  const { testId } = req.params;
  
  if (!testId) {
    return res.status(400).json({ error: 'ID da prova é obrigatório.' });
  }
  
  try {
    console.log(`[Theoretical Test] Cancelando prova ${testId}`);
    
    // Buscar a prova para verificar se existe
    const appliedTest = await baserowServer.getRow(PROVAS_TEORICAS_APLICADAS_TABLE_ID, parseInt(testId));
    if (!appliedTest) {
      return res.status(404).json({ error: 'Prova não encontrada.' });
    }
    
    // Marcar como cancelada (status = false)
    await baserowServer.patch(PROVAS_TEORICAS_APLICADAS_TABLE_ID, parseInt(testId), {
      status: false,
      data_de_resposta: new Date().toISOString()
    });
    
    console.log(`[Theoretical Test] Prova ${testId} cancelada com sucesso`);
    
    res.json({ 
      success: true, 
      message: 'Prova cancelada com sucesso!' 
    });
  } catch (error: unknown) {
    console.error(`[Theoretical Test] Erro ao cancelar prova:`, error);
    res.status(500).json({ error: 'Erro ao cancelar a prova.' });
  }
});

// GET /api/theoretical-test/check/:candidateId - Verificar se candidato tem prova existente
app.get('/api/theoretical-test/check/:candidateId', async (req: Request, res: Response) => {
  const { candidateId } = req.params;
  
  // Pegar o ID do usuário dos headers
  const userId = req.headers['x-user-id'] || req.query.userId || '1';
  
  if (!candidateId) {
    return res.status(400).json({ error: 'ID do candidato é obrigatório.' });
  }
  
  try {
    console.log(`[Theoretical Test] Verificando prova existente para candidato ${candidateId}`);
    
    const { results: existingTests } = await baserowServer.get(
      PROVAS_TEORICAS_APLICADAS_TABLE_ID,
      `?filter__candidato=${candidateId}&filter__recrutador=${userId}&filter__status=true`
    );
    
    if (existingTests && existingTests.length > 0) {
      const existingTest = existingTests[0];
      
      // Buscar nome do modelo
      let modelName = 'Modelo não encontrado';
      if (existingTest.modelo_da_prova && existingTest.modelo_da_prova.length > 0) {
        try {
          const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, existingTest.modelo_da_prova[0].id);
          if (model) {
            modelName = model.titulo || model.nome;
          }
        } catch (modelError) {
          console.error('Erro ao buscar modelo:', modelError);
        }
      }
      
      res.json({
        success: true,
        hasExistingTest: true,
        data: {
          id: existingTest.id,
          modelo_nome: modelName,
          data_inicio: existingTest.data_de_geracao,
          link: `${FRONTEND_URL}/prova-teorica/${existingTest.id}`
        }
      });
    } else {
      res.json({
        success: true,
        hasExistingTest: false
      });
    }
  } catch (error: unknown) {
    console.error(`[Theoretical Test] Erro ao verificar prova existente:`, error);
    res.status(500).json({ error: 'Erro ao verificar prova existente.' });
  }
});

// ========================================
// ENDPOINTS - SISTEMA DE PROVAS TEÓRICAS
// ========================================

// GET /api/theoretical-templates - Listar apenas templates disponíveis para duplicação
app.get('/api/theoretical-templates', async (req: Request, res: Response) => {
  try {
    console.log('🎯 Buscando templates de prova teórica');
    const response = await baserowServer.get(PROVAS_TEORICAS_MODELOS_TABLE_ID);
    
    if (!response.results || !Array.isArray(response.results)) {
      return res.json({ success: true, data: [] });
    }

    // Filtrar apenas modelos que são templates (criado_por = 2)
    console.log(`📋 Total de modelos encontrados: ${response.results.length}`);
    
    const templates = response.results.filter((model: any) => {
      // Verificar se criado_por é objeto ou array (relacionamento Baserow)
      let modelOwner = model.criado_por;
      
      console.log(`🔎 DEBUG TEMPLATE modelo ${model.id}: criado_por raw=`, JSON.stringify(modelOwner));
      
      // Se criado_por é um array (relacionamento do Baserow), pegar o primeiro
      if (Array.isArray(modelOwner) && modelOwner.length > 0) {
        modelOwner = modelOwner[0].id || modelOwner[0].value || modelOwner[0];
      }
      // Se criado_por é um objeto, extrair o ID
      else if (typeof modelOwner === 'object' && modelOwner !== null) {
        modelOwner = modelOwner.id || modelOwner.value || 2;
      }
      
      if (!modelOwner || modelOwner === '') {
        modelOwner = 2; // Padrão usuário 2 para templates
      }
      
      console.log(`🔎 DEBUG TEMPLATE modelo ${model.id}: criado_por final=${modelOwner}`);

      const isActive = model.ativo;
      const isFromTemplateUser = String(modelOwner) === '2';
      
      console.log(`🔍 Modelo ${model.id}: titulo="${model.titulo}", ativo=${isActive}, criado_por=${modelOwner}, é_template=${isFromTemplateUser}`);
      
      // Só mostrar templates ativos do usuário 2 (criador de templates)
      return isActive && isFromTemplateUser;
    }).map((model: any) => {
      let questoes = [];
      try {
        questoes = model.perguntas ? JSON.parse(model.perguntas) : [];
      } catch (parseError) {
        console.error('Erro ao processar JSON das questões:', parseError);
        questoes = [];
      }

      return {
        id: model.id,
        nome: model.titulo,
        descricao: model.descricao,
        tempo_limite: model.tempo_limite,
        total_questoes: questoes.length,
        questoes: questoes,
        is_template: true,
        created_at: model.created_at,
        updated_at: model.updated_at
      };
    });

    console.log(`✅ Templates encontrados: ${templates.length}`);
    templates.forEach(template => {
      console.log(`📝 Template: ID=${template.id}, Nome="${template.nome}", Questões=${template.total_questoes}`);
    });
    res.json({ success: true, data: templates });
  } catch (error: any) {
    console.error('Erro ao buscar templates:', error);
    res.status(500).json({ error: 'Erro ao carregar templates de prova teórica.' });
  }
});

// POST /api/theoretical-templates/:templateId/duplicate - Duplicar template para usuário
app.post('/api/theoretical-templates/:templateId/duplicate', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { userId, customName, customDescription } = req.body;
    
    console.log(`🎯 Duplicando template ${templateId} para usuário ${userId}`);
    
    // Buscar o template original
    const templateResponse = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(templateId));
    
    if (!templateResponse) {
      return res.status(404).json({ error: 'Template não encontrado.' });
    }

    // Criar novo modelo baseado no template
    const newModelData = {
      titulo: customName || `${templateResponse.titulo} - Cópia`,
      descricao: customDescription || templateResponse.descricao,
      tempo_limite: templateResponse.tempo_limite,
      perguntas: templateResponse.perguntas, // Manter as mesmas questões
      ativo: true, // Novo modelo ativo por padrão
      criado_por: parseInt(userId), // Definir o usuário como proprietário
      template_original: parseInt(templateId) // Referenciar o template original
    };

    console.log('🏗️ Criando modelo duplicado:', newModelData);
    const createdModel = await baserowServer.post(PROVAS_TEORICAS_MODELOS_TABLE_ID, newModelData);
    
    console.log('✅ Template duplicado com sucesso:', createdModel.id);
    res.json({ 
      success: true, 
      data: {
        id: createdModel.id,
        nome: createdModel.titulo,
        descricao: createdModel.descricao,
        message: 'Template duplicado com sucesso!'
      }
    });
  } catch (error: any) {
    console.error('Erro ao duplicar template:', error);
    res.status(500).json({ error: 'Erro ao duplicar template.' });
  }
});

// GET /api/theoretical-models - Listar APENAS modelos do próprio usuário (não templates)
app.get('/api/theoretical-models', async (req: Request, res: Response) => {
  try {
    // Pegar o ID do usuário dos headers ou query params
    const userId = req.headers['x-user-id'] || req.query.userId || '1'; // Default correto
    
    console.log('🔍 Buscando modelos próprios para usuário:', userId);
    console.log('🔍 Este endpoint deve mostrar modelos criados/duplicados pelo usuário');
    console.log('🔍 Buscando modelos na tabela:', PROVAS_TEORICAS_MODELOS_TABLE_ID);
    
    // Buscar todos os modelos e filtrar no backend
    const response = await baserowServer.get(PROVAS_TEORICAS_MODELOS_TABLE_ID);
    
    if (!response.results || !Array.isArray(response.results)) {
      console.log('⚠️ Nenhum resultado encontrado ou formato inválido');
      return res.json({ success: true, data: [] });
    }

    // 🎯 NOVO FILTRO: Apenas modelos do próprio usuário (não templates)
    const filteredResults = response.results.filter((model: any) => {
      // Verificar se criado_por é objeto
      let modelOwner = model.criado_por;
      if (typeof modelOwner === 'object' && modelOwner !== null) {
        modelOwner = modelOwner.id || modelOwner.value || null;
      }
      
      console.log(`🔍 Modelo ${model.id}: criado_por=${modelOwner}, userId=${userId}, ativo=${model.ativo}`);
      
      // Template creator (usuário 2) vê todos os modelos
      if (String(userId) === '2') {
        return true;
      }
      
      // Usuários normais veem APENAS seus próprios modelos (não templates do sistema)
      return modelOwner && String(modelOwner) === String(userId);
    });

    const models = filteredResults.map((model: any) => {
      console.log('🔧 Processando modelo:', model.id, model.titulo, 'do usuário:', model.criado_por || 1);
      
      let questoes = [];
      try {
        if (typeof model.perguntas === 'string') {
          questoes = JSON.parse(model.perguntas || '[]');
        } else if (Array.isArray(model.perguntas)) {
          questoes = model.perguntas;
        } else if (model.perguntas && typeof model.perguntas === 'object') {
          questoes = [model.perguntas];
        }
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse das questões do modelo', model.id, ':', parseError);
        questoes = [];
      }

      return {
        id: model.id,
        nome: model.titulo,        // Campo é 'titulo' no Baserow
        descricao: model.descricao,
        tempo_limite: model.tempo_limite,
        questoes: questoes,
        ativo: model.ativo,
        criado_por: model.criado_por || 1, // Incluir info do criador
        is_template: (model.criado_por || 2) === 2, // Marcar se é template (do usuário 2)
        created_at: model.created_at || null,
        updated_at: model.updated_at || null
      };
    });

    console.log('✅ Modelos processados:', models.length);
    res.json({ success: true, data: models });
  } catch (error: unknown) {
    console.error('❌ Erro ao buscar modelos de prova:', error);
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

    // Pegar o ID do usuário dos headers ou query params
    const userId = req.headers['x-user-id'] || req.body.userId || '1'; // Default para usuário 1
    
    // Criar dados para o Baserow usando os nomes corretos dos campos
    const newModelData = {
      titulo: String(nome).trim(),        // Campo é 'titulo' no Baserow, não 'nome'
      descricao: descricao ? String(descricao).trim() : '', 
      tempo_limite: tempoLimiteNum,
      perguntas: JSON.stringify(questoesComId), // Campo é 'perguntas' no Baserow, não 'questoes'
      ativo: ativoBoolean,
      criado_por: parseInt(String(userId)) // Associar ao usuário que está criando
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
  const userId = req.headers['x-user-id'] || req.query.userId || '1'; // ID do usuário logado
  
  console.log(`🗑️ DELETE Request - ID: ${id}, Usuário: ${userId}`);

  try {
    // Verificar se o modelo existe
    console.log(`🔍 Verificando se modelo ${id} existe...`);
    const existingModel = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(id));
    if (!existingModel) {
      console.log(`❌ Modelo ${id} não encontrado`);
      return res.status(404).json({ error: 'Modelo de prova não encontrado.' });
    }
    
    // Verificar se o usuário pode excluir este modelo
    const modelOwner = existingModel.criado_por || 2; // Default para usuário 2 se não tiver o campo
    if (String(modelOwner) !== String(userId)) {
      console.log(`❌ Usuário ${userId} não pode excluir modelo do usuário ${modelOwner}`);
      return res.status(403).json({ 
        error: 'Você não tem permissão para excluir este modelo. Apenas o criador pode excluir seus próprios modelos.' 
      });
    }
    
    console.log(`✅ Modelo ${id} encontrado e usuário autorizado:`, existingModel.titulo);

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

// POST /api/theoretical-test/generate - Gerar prova para candidato (similar ao comportamental)
app.post('/api/theoretical-test/generate', async (req: Request, res: Response) => {
  // Aceitar tanto o formato antigo (candidato_id) quanto o novo (candidateId) para compatibilidade
  const { 
    candidateId, 
    modeloId, 
    recruiterId,
    candidato_id,
    modelo_prova_id 
  } = req.body;

  // Usar o formato que estiver disponível
  const finalCandidateId = candidateId || candidato_id;
  const finalModeloId = modeloId || modelo_prova_id;

  console.log('[Theoretical Test] Requisição recebida:', { 
    candidateId: finalCandidateId, 
    modeloId: finalModeloId, 
    recruiterId,
    body: req.body 
  });

  if (!finalCandidateId || !finalModeloId) {
    console.log('[Theoretical Test] Erro: dados obrigatórios faltando');
    return res.status(400).json({ 
      error: 'ID do candidato e ID do modelo de prova são obrigatórios.',
      received: { candidateId: finalCandidateId, modeloId: finalModeloId }
    });
  }

  try {
    console.log('[Theoretical Test] 1. Verificando candidato...');
    
    // Verificar se o candidato existe
    const candidate = await baserowServer.getRow(CANDIDATOS_TABLE_ID, parseInt(finalCandidateId));
    if (!candidate) {
      console.log('[Theoretical Test] ❌ Candidato não encontrado:', finalCandidateId);
      return res.status(404).json({ error: 'Candidato não encontrado.' });
    }
    console.log('[Theoretical Test] ✅ Candidato encontrado:', candidate.nome);

    console.log('[Theoretical Test] 2. Verificando modelo...');
    
    // Verificar se o modelo existe e está ativo
    const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(finalModeloId));
    if (!model) {
      console.log('[Theoretical Test] ❌ Modelo não encontrado:', finalModeloId);
      return res.status(404).json({ error: 'Modelo de prova não encontrado.' });
    }
    console.log('[Theoretical Test] ✅ Modelo encontrado:', model.titulo);

    if (!model.ativo) {
      console.log('[Theoretical Test] ❌ Modelo inativo:', model.ativo);
      return res.status(400).json({ error: 'Este modelo de prova não está ativo.' });
    }
    console.log('[Theoretical Test] ✅ Modelo ativo');

    console.log('[Theoretical Test] 3. Pronto para criar nova prova...');
    
    // Igual ao comportamental: permitir múltiplas provas sem verificação de existência
    // O candidato pode ter várias provas (Pendente, Concluído, etc.)

    console.log('[Theoretical Test] 4. Criando nova prova...');
    console.log('[Theoretical Test] Tabela ID:', PROVAS_TEORICAS_APLICADAS_TABLE_ID);
    
    // Criar nova prova aplicada (similar ao comportamental)
    const appliedTestData: any = {
      candidato: [parseInt(finalCandidateId)], // Link field - array com ID do candidato
      modelo_da_prova: [parseInt(finalModeloId)], // Link field - array com ID do modelo
      data_de_geracao: new Date().toISOString(), // Data de geração
      pontuacao_total: 0, // Pontuação inicial zero
      status: 'Pendente' // Igual ao comportamental: Pendente, Processando, Concluído, Erro
    };

    // Adicionar recrutador se fornecido (Link to table usuarios)
    if (recruiterId) {
      appliedTestData.recrutador = [parseInt(recruiterId)];
      console.log('[Theoretical Test] Adicionado recrutador:', recruiterId);
    }

    if (recruiterId) {
      // Se tiver recrutador, adicionar ao registro
      appliedTestData.recrutador = [parseInt(recruiterId)];
      console.log('[Theoretical Test] Adicionado recrutador:', recruiterId);
    }

    console.log('[Theoretical Test] Dados para criar:', JSON.stringify(appliedTestData, null, 2));
    
    const createdTest = await baserowServer.post(PROVAS_TEORICAS_APLICADAS_TABLE_ID, appliedTestData);
    console.log('[Theoretical Test] ✅ Prova criada com ID:', createdTest.id);

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
              nome_modelo: model.titulo,
              tempo_limite: model.tempo_limite,
              link: `${FRONTEND_URL}/prova-teorica/${createdTest.id}`
            }
          })
        });
      } catch (webhookError) {
        console.error('Erro ao enviar webhook de prova gerada:', webhookError);
      }
    }

    console.log('[Theoretical Test] Prova criada com sucesso:', createdTest.id);
    
    // Retorno compatível com frontend existente
    res.status(201).json({ 
      success: true, 
      data: {
        id: createdTest.id,
        candidato_id: finalCandidateId,
        modelo_prova_id: finalModeloId,
        status: 'em_andamento',
        data_inicio: createdTest.data_de_geracao,
        link: `${FRONTEND_URL}/prova-teorica/${createdTest.id}`
      },
      testId: createdTest.id, // Manter para compatibilidade futura
      link: `${FRONTEND_URL}/prova-teorica/${createdTest.id}`,
      candidateName: candidate.nome,
      modelName: model.titulo
    });
  } catch (error: unknown) {
    console.error('Erro ao gerar prova para candidato:', error);
    res.status(500).json({ error: 'Não foi possível gerar a prova para o candidato.' });
  }
});

// GET /api/theoretical-test/:candidateId - Buscar prova em andamento do candidato
app.get('/api/theoretical-test/:candidateId', async (req: Request, res: Response) => {
  const { candidateId } = req.params;
  
  // Pegar o ID do usuário dos headers
  const userId = req.headers['x-user-id'] || req.query.userId || '1';

  try {
    const { results } = await baserowServer.get(
      PROVAS_TEORICAS_APLICADAS_TABLE_ID,
      `?filter__candidato=${candidateId}&filter__recrutador=${userId}`
    );

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Nenhuma prova em andamento encontrada para este candidato.' });
    }

    const appliedTest = results[0];
    
    // Verificar se a prova já foi respondida (Concluído = finalizada)
    if (appliedTest.status && (appliedTest.status.value === 'Concluído' || appliedTest.status === 'Concluído')) {
      return res.status(400).json({ 
        error: 'Esta prova já foi respondida e não pode ser feita novamente.',
        already_completed: true 
      });
    }
    
    // Buscar o modelo da prova para obter as questões
    // appliedTest.modelo_da_prova é um array de links, pegar o primeiro ID
    const modeloId = appliedTest.modelo_da_prova?.[0] || appliedTest.modelo_da_prova;
    const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(modeloId));
    
    if (!model) {
      return res.status(404).json({ error: 'Modelo de prova não encontrado.' });
    }

    const questoes = typeof model.perguntas === 'string' 
      ? JSON.parse(model.perguntas || '[]')
      : (Array.isArray(model.perguntas) ? model.perguntas : []);
    const questoesRespostas = JSON.parse(appliedTest.respostas_candidato || '[]');

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
      modelo_nome: model.titulo, // Campo correto no modelo
      modelo_descricao: model.descricao,
      tempo_limite: model.tempo_limite,
      questoes: questoesParaCandidato,
      status: appliedTest.status, // Boolean: true = em andamento, false = finalizada
      data_inicio: appliedTest.data_de_geracao // Campo correto
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

    if (appliedTest.status && (appliedTest.status.value === 'Concluído' || appliedTest.status === 'Concluído')) {
      return res.status(400).json({ error: 'Esta prova não está mais em andamento.' });
    }

    // Buscar o modelo para calcular pontuação
    const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, parseInt(appliedTest.modelo_prova_id));
    if (!model) {
      return res.status(404).json({ error: 'Modelo de prova não encontrado.' });
    }

    const questoes = typeof model.perguntas === 'string' 
      ? JSON.parse(model.perguntas || '[]')
      : (Array.isArray(model.perguntas) ? model.perguntas : []);
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
      respostas_candidato: JSON.stringify(questoesRespostasAtualizadas), // Campo correto
      pontuacao_total: pontuacaoTotal,
      status: 'Concluído', // Status correto: Concluído quando finalizada
      data_de_resposta: new Date().toISOString() // Campo correto para data de finalização
    };

    const updatedTest = await baserowServer.patch(PROVAS_TEORICAS_APLICADAS_TABLE_ID, parseInt(testId), updateData);

    // Enviar notificação de prova finalizada via N8N
    if (N8N_THEORETICAL_WEBHOOK_URL) {
      try {
        // Extrair ID do candidato (pode vir como array ou número)
        const candidatoId = Array.isArray(appliedTest.candidato) 
          ? appliedTest.candidato[0] 
          : appliedTest.candidato;
        const candidate = await baserowServer.getRow(CANDIDATOS_TABLE_ID, parseInt(candidatoId));
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
              nome_modelo: model.titulo, // Campo correto
              pontuacao_total: pontuacaoTotal,
              data_finalizacao: updateData.data_de_resposta // Campo correto
            }
          })
        });
      } catch (webhookError) {
        console.error('Erro ao enviar webhook de prova finalizada:', webhookError);
      }
    }

    res.json({ 
      success: true, 
      message: 'Prova submetida com sucesso! Obrigado por participar. Em breve entraremos em contato com o resultado.'
    });
  } catch (error: unknown) {
    console.error('Erro ao submeter prova:', error);
    res.status(500).json({ error: 'Não foi possível submeter a prova.' });
  }
});

// GET /api/theoretical-test/results/:candidateId - Buscar resultados das provas do candidato
app.get('/api/theoretical-test/results/:candidateId', async (req: Request, res: Response) => {
  const { candidateId } = req.params;
  
  // Pegar o ID do usuário dos headers
  const userId = req.headers['x-user-id'] || req.query.userId || '1';

  try {
    console.log(`🔍 Buscando provas para candidato ${candidateId} do usuário ${userId}`);
    
    // 🔒 BUSCAR PROVAS COM ISOLAMENTO DUPLO: candidato + recrutador
    const allResults = await baserowServer.get(
      PROVAS_TEORICAS_APLICADAS_TABLE_ID,
      `?filter__candidato=${candidateId}&filter__recrutador=${userId}&order_by=-data_de_resposta`
    );

    // ✅ PROVAS JÁ FILTRADAS NA QUERY - mas adicionar verificação extra por segurança
    const results = allResults.results || [];
    
    // 🔒 VERIFICAÇÃO ADICIONAL DE SEGURANÇA - garantir isolamento SaaS
    const filteredResults = results.filter((test: any) => {
      const testRecruiter = test.recrutador;
      const isValid = String(testRecruiter) === String(userId);
      console.log(`🔍 Prova ${test.id}: candidato=${candidateId}, recrutador=${testRecruiter}, userId=${userId}, válida=${isValid}`);
      return isValid;
    });
    
    if (filteredResults.length !== results.length) {
      console.log(`⚠️ ALERTA SEGURANÇA: ${results.length - filteredResults.length} provas filtradas por isolamento`);
    }

    console.log(`📊 Encontradas ${filteredResults?.length || 0} provas para candidato ${candidateId}`);

    if (!filteredResults || filteredResults.length === 0) {
      console.log(`✅ Nenhuma prova encontrada - retornando array vazio`);
      return res.json({ success: true, data: [] });
    }

    const formattedResults = await Promise.all(filteredResults.map(async (test: {
      id: number;
      modelo_da_prova: any[];
      pontuacao_total?: number;
      data_de_resposta?: string;
      status: string;
    }) => {
      // Buscar modelo para obter nome
      let modelName = 'Modelo não encontrado';
      if (test.modelo_da_prova && test.modelo_da_prova.length > 0) {
        try {
          const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, test.modelo_da_prova[0].id);
          modelName = model?.titulo || 'Modelo não encontrado';
        } catch (error) {
          console.error('Erro ao buscar modelo:', error);
        }
      }
      
      return {
        id: test.id,
        modelo_nome: modelName,
        pontuacao_total: test.pontuacao_total || 0,
        status: test.status || 'Pendente', // Usar o status string diretamente
        data_finalizacao: test.data_de_resposta
      };
    }));

    res.json({ success: true, data: formattedResults });
  } catch (error: unknown) {
    console.error('Erro ao buscar resultados das provas:', error);
    res.status(500).json({ error: 'Não foi possível buscar os resultados das provas.' });
  }
});



// DELETE /api/theoretical-test/:candidateId/cancel - Cancelar prova em andamento
app.delete('/api/theoretical-test/:candidateId/cancel', async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    
    // Pegar o ID do usuário dos headers
    const userId = req.headers['x-user-id'] || req.query.userId || '1';

    // Buscar prova em andamento filtrando por usuário
    const { results: existingTests } = await baserowServer.get(
      PROVAS_TEORICAS_APLICADAS_TABLE_ID, 
      `?filter__candidato=${candidateId}&filter__recrutador=${userId}`
    );

    if (!existingTests || existingTests.length === 0) {
      return res.status(404).json({ 
        error: 'Nenhuma prova em andamento encontrada para este candidato.' 
      });
    }

    const testToCancel = existingTests[0];

    // Atualizar status para cancelada
    await baserowServer.patch(PROVAS_TEORICAS_APLICADAS_TABLE_ID, testToCancel.id, {
      status: 'Processando', // Usar valor válido do Baserow - será testado
      data_de_resposta: new Date().toISOString(), // Data de cancelamento
      observacoes: 'Prova cancelada para permitir nova geração'
    });

    res.json({ 
      success: true, 
      message: 'Prova cancelada com sucesso. Agora é possível gerar uma nova prova.' 
    });
  } catch (error: unknown) {
    console.error('Erro ao cancelar prova:', error);
    res.status(500).json({ error: 'Não foi possível cancelar a prova.' });
  }
});

// DELETE /api/theoretical-test/delete/:testId - Excluir prova permanentemente
app.delete('/api/theoretical-test/delete/:testId', async (req: Request, res: Response) => {
  const { testId } = req.params;
  
  if (!testId) {
    return res.status(400).json({ error: 'ID da prova é obrigatório.' });
  }
  
  try {
    console.log(`[Theoretical Test] Excluindo prova ${testId} permanentemente`);
    
    // Verificar se a prova existe antes de excluir
    const appliedTest = await baserowServer.getRow(PROVAS_TEORICAS_APLICADAS_TABLE_ID, parseInt(testId));
    if (!appliedTest) {
      return res.status(404).json({ error: 'Prova não encontrada.' });
    }
    
    // Excluir a prova permanentemente
    await baserowServer.delete(PROVAS_TEORICAS_APLICADAS_TABLE_ID, parseInt(testId));
    
    console.log(`[Theoretical Test] Prova ${testId} excluída com sucesso`);
    
    res.json({ 
      success: true, 
      message: 'Prova excluída permanentemente.' 
    });
  } catch (error: unknown) {
    console.error(`[Theoretical Test] Erro ao excluir prova:`, error);
    res.status(500).json({ error: 'Não foi possível excluir a prova.' });
  }
});

// GET /api/theoretical-test/review/:testId - Buscar gabarito e respostas da prova para revisão
app.get('/api/theoretical-test/review/:testId', async (req: Request, res: Response) => {
  const { testId } = req.params;
  
  console.log(`[Theoretical Test REVIEW] === INICIO DA REQUISIÇÃO ===`);
  console.log(`[Theoretical Test REVIEW] testId recebido: "${testId}"`);
  console.log(`[Theoretical Test REVIEW] typeof testId: ${typeof testId}`);
  
  if (!testId) {
    console.log(`[Theoretical Test REVIEW] ERRO: testId vazio`);
    return res.status(400).json({ error: 'ID da prova é obrigatório.' });
  }
  
  try {
    console.log(`[Theoretical Test REVIEW] Buscando gabarito da prova ${testId}`);
    console.log(`[Theoretical Test REVIEW] Table ID: ${PROVAS_TEORICAS_APLICADAS_TABLE_ID}`);
    console.log(`[Theoretical Test REVIEW] parseInt(testId): ${parseInt(testId)}`);
    
    // Buscar a prova aplicada
    const appliedTest = await baserowServer.getRow(PROVAS_TEORICAS_APLICADAS_TABLE_ID, parseInt(testId));
    console.log(`[Theoretical Test REVIEW] Prova encontrada:`, !!appliedTest);
    if (!appliedTest) {
      return res.status(404).json({ error: 'Prova não encontrada.' });
    }
    
    // Buscar dados do candidato
    let candidateName = 'Candidato não encontrado';
    if (appliedTest.candidato && appliedTest.candidato.length > 0) {
      try {
        const candidate = await baserowServer.getRow(CANDIDATOS_TABLE_ID, appliedTest.candidato[0].id);
        if (candidate) {
          candidateName = candidate.nome;
        }
      } catch (error) {
        console.error('[Review] Erro ao buscar candidato:', error);
      }
    }
    
    // Buscar modelo da prova
    let modelData = null;
    if (appliedTest.modelo_da_prova && appliedTest.modelo_da_prova.length > 0) {
      try {
        const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, appliedTest.modelo_da_prova[0].id);
        if (model) {
          modelData = {
            id: model.id,
            titulo: model.titulo,
            descricao: model.descricao,
            questoes: typeof model.perguntas === 'string' 
              ? JSON.parse(model.perguntas || '[]')
              : (Array.isArray(model.perguntas) ? model.perguntas : [])
          };
        }
      } catch (error) {
        console.error('[Review] Erro ao buscar modelo:', error);
      }
    }
    
    if (!modelData) {
      return res.status(404).json({ error: 'Modelo da prova não encontrado.' });
    }
    
    // Parse das respostas do candidato
    let respostasCandidato = {};
    try {
      respostasCandidato = appliedTest.respostas_candidato 
        ? JSON.parse(appliedTest.respostas_candidato) 
        : {};
    } catch (error) {
      console.error('[Review] Erro ao parsear respostas:', error);
    }
    
    // Calcular estatísticas da prova
    let acertos = 0;
    const totalQuestoes = modelData.questoes.length;
    
    // Contar acertos para questões objetivas
    modelData.questoes.forEach((questao: any) => {
      if (questao.tipo === 'verdadeiro_falso' || questao.tipo === 'multipla_escolha') {
        const respostaCandidato = (respostasCandidato as any)[questao.id];
        if (respostaCandidato === questao.resposta_correta) {
          acertos++;
        }
      }
    });
    
    console.log(`[Review] Estatísticas: ${acertos}/${totalQuestoes} acertos`);
    
    res.json({ 
      success: true, 
      data: { 
        test: {
          testId: appliedTest.id,
          candidato_nome: candidateName,
          modelo_nome: modelData.titulo,  // Usar titulo como modelo_nome
          pontuacao_total: appliedTest.pontuacao_total || 0,
          acertos: acertos,
          total_questoes: totalQuestoes,
          status: appliedTest.status,
          data_finalizacao: appliedTest.data_de_resposta,
          data_geracao: appliedTest.data_de_geracao
        },
        questions: modelData.questoes,
        candidateAnswers: Object.entries(respostasCandidato).map(([questionId, answer]) => ({
          question_id: questionId,
          answer: answer
        }))
      } 
    });
  } catch (error: unknown) {
    console.error('[Review] Erro:', error);
    res.status(500).json({ error: 'Não foi possível buscar os dados da prova.' });
  }
});

// GET /api/theoretical-test-results/:candidateId - Buscar resultados das provas teóricas do candidato
app.get('/api/theoretical-test-results/:candidateId', async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    
    // Pegar o ID do usuário dos headers
    const userId = req.headers['x-user-id'] || req.query.userId || '1';

    // Buscar todas as provas do candidato filtrando por usuário
    const response = await baserowServer.get(PROVAS_TEORICAS_APLICADAS_TABLE_ID, `?filter__candidato=${candidateId}&filter__recrutador=${userId}`);
    
    if (!response.results || !Array.isArray(response.results)) {
      return res.json({ success: true, data: [] });
    }

    // Para cada prova, buscar dados do modelo
    const testsWithModels = await Promise.all(
      response.results.map(async (test: {
        id: number;
        modelo_da_prova: number[] | number; // Link field pode ser array ou número
        status: boolean; // Boolean em vez de string
        pontuacao_total?: number;
        data_de_resposta?: string;
      }) => {
        try {
          // Extrair ID do modelo (pode vir como array ou número direto)
          const modeloId = Array.isArray(test.modelo_da_prova) 
            ? test.modelo_da_prova[0] 
            : test.modelo_da_prova;
            
          const model = await baserowServer.getRow(PROVAS_TEORICAS_MODELOS_TABLE_ID, modeloId);
          return {
            id: test.id,
            modelo_prova: {
              nome: model?.titulo || 'Modelo não encontrado' // Campo correto
            },
            status: test.status ? 'em_andamento' : 'finalizada', // Converter boolean para string
            pontuacao: test.pontuacao_total,
            total_questoes: model.perguntas 
              ? (typeof model.perguntas === 'string' 
                 ? JSON.parse(model.perguntas).length 
                 : (Array.isArray(model.perguntas) ? model.perguntas.length : 0))
              : 0,
            data_finalizacao: test.data_de_resposta // Campo correto
          };
        } catch (error) {
          console.error('Erro ao buscar modelo da prova:', error);
          return {
            id: test.id,
            modelo_prova: { nome: 'Modelo não encontrado' },
            status: test.status ? 'em_andamento' : 'finalizada',
            pontuacao: test.pontuacao_total,
            acertos: 0, // Será calculado a partir das respostas se necessário
            total_questoes: 0,
            data_finalizacao: test.data_de_resposta
          };
        }
      })
    );

    res.json({ success: true, data: testsWithModels });

  } catch (error: unknown) {
    console.error('Erro ao buscar resultados das provas teóricas:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
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
}).on('error', (err: Error & { code?: string }) => {
  console.error('❌ Erro ao iniciar servidor:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️  A porta ${port} já está em uso. Tente usar uma porta diferente.`);
  }
  process.exit(1);
});

// Tratamento de erros não capturadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rejeição não tratada em:', promise, 'motivo:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  process.exit(1);
});