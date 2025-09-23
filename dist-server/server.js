// Caminho: server.ts
// SUBSTITUA O CONTEÚDO INTEIRO DESTE ARQUIVO
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import { baserowServer } from './src/shared/services/baserowServerClient.js';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import multer from 'multer';
const app = express();
const port = process.env.PORT || 3001;
// Configuração do Multer para upload de ficheiros em memória
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB para vídeos
        fieldSize: 100 * 1024 * 1024 // 100MB para campos
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
// Validação crítica de variáveis de ambiente
const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'VITE_BASEROW_API_KEY',
    'TESTE_COMPORTAMENTAL_WEBHOOK_URL'
];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error("ERRO CRÍTICO: Variáveis de ambiente obrigatórias não encontradas:");
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    console.error("Verifique o arquivo .env ou as configurações do container");
    process.exit(1);
}
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    console.error("ERRO CRÍTICO: As credenciais do Google não foram encontradas...");
    console.error("Verifique as variáveis de ambiente no arquivo .env");
    process.exit(1);
}
const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
const USERS_TABLE_ID = '711';
const VAGAS_TABLE_ID = '709';
const CANDIDATOS_TABLE_ID = '710';
const WHATSAPP_CANDIDATOS_TABLE_ID = '712';
const AGENDAMENTOS_TABLE_ID = '713';
const SALT_ROUNDS = 10;
const TESTE_COMPORTAMENTAL_TABLE_ID = '727';
const TESTE_COMPORTAMENTAL_WEBHOOK_URL = process.env.TESTE_COMPORTAMENTAL_WEBHOOK_URL;
const N8N_TRIAGEM_WEBHOOK_URL = process.env.N8N_FILE_UPLOAD_URL;
app.post('/api/auth/signup', async (req, res) => {
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
    }
    catch (error) {
        console.error('Erro no registro (backend):', error);
        res.status(500).json({ error: error.message || 'Erro ao criar conta.' });
    }
});
app.post('/api/auth/login', async (req, res) => {
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
        }
        else {
            res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        }
    }
    catch (error) {
        console.error('Erro no login (backend):', error);
        res.status(500).json({ error: error.message || 'Erro ao fazer login.' });
    }
});
app.patch('/api/users/:userId/profile', async (req, res) => {
    const { userId } = req.params;
    const { nome, empresa, avatar_url } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }
    try {
        const updatedData = {};
        if (nome !== undefined)
            updatedData.nome = nome;
        if (empresa !== undefined)
            updatedData.empresa = empresa;
        if (avatar_url !== undefined)
            updatedData.avatar_url = avatar_url;
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
    }
    catch (error) {
        console.error('Erro ao atualizar perfil (backend):', error);
        res.status(500).json({ error: 'Não foi possível atualizar o perfil.' });
    }
});
app.patch('/api/users/:userId/password', async (req, res) => {
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
    }
    catch (error) {
        console.error('Erro ao atualizar senha (backend):', error);
        res.status(500).json({ error: 'Não foi possível atualizar a senha. Tente novamente.' });
    }
});
app.get('/api/users/:userId', async (req, res) => {
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
    }
    catch (error) {
        console.error('Erro ao buscar perfil do usuário (backend):', error);
        res.status(500).json({ error: 'Não foi possível buscar o perfil do usuário.' });
    }
});
app.post('/api/upload-avatar', upload.single('avatar'), async (req, res) => {
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
    }
    catch (error) {
        console.error('Erro ao fazer upload de avatar (backend):', error);
        res.status(500).json({ error: error.message || 'Não foi possível fazer upload do avatar.' });
    }
});
app.post('/api/jobs', async (req, res) => {
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
    }
    catch (error) {
        console.error('Erro ao criar vaga (backend):', error);
        res.status(500).json({ error: 'Não foi possível criar a vaga.' });
    }
});
app.patch('/api/jobs/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const updatedData = req.body;
    if (!jobId || Object.keys(updatedData).length === 0) {
        return res.status(400).json({ error: 'ID da vaga e dados para atualização são obrigatórios.' });
    }
    try {
        const updatedJob = await baserowServer.patch(VAGAS_TABLE_ID, parseInt(jobId), updatedData);
        res.json(updatedJob);
    }
    catch (error) {
        console.error('Erro ao atualizar vaga (backend):', error);
        res.status(500).json({ error: 'Não foi possível atualizar a vaga.' });
    }
});
app.delete('/api/jobs/:jobId', async (req, res) => {
    const { jobId } = req.params;
    if (!jobId) {
        return res.status(400).json({ error: 'ID da vaga é obrigatório.' });
    }
    try {
        await baserowServer.delete(VAGAS_TABLE_ID, parseInt(jobId));
        res.status(204).send();
    }
    catch (error) {
        console.error('Erro ao deletar vaga (backend):', error);
        res.status(500).json({ error: 'Não foi possível excluir a vaga.' });
    }
});
// ==================================================================
// === HEALTH CHECK ===
// ==================================================================
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'recrutamento-backend',
        version: '1.0.0'
    });
});
app.get('/', (req, res) => {
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
app.patch('/api/candidates/:candidateId/status', async (req, res) => {
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
    }
    catch (error) {
        console.error('Erro ao atualizar status do candidato (backend):', error);
        res.status(500).json({ error: 'Não foi possível atualizar o status do candidato.' });
    }
});
// 2. NOVA ROTA - Upload de Vídeo de Entrevista
app.post('/api/candidates/:candidateId/video-interview', upload.single('video'), async (req, res) => {
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Erro no upload do resultado do teste:', error.message);
        res.status(500).json({ error: 'Falha ao processar o upload do resultado.' });
    }
});
// 4. NOVA ROTA - Atualização Manual da Última Data de Contato
app.patch('/api/candidates/:candidateId/update-contact', async (req, res) => {
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
    }
    catch (error) {
        console.error('Erro ao atualizar data de contato:', error.message);
        res.status(500).json({ error: 'Falha ao atualizar data de contato.' });
    }
});
// ==================================================================
// === FIM DAS NOVAS FUNCIONALIDADES (FASE 1) =========================
// ==================================================================
app.get('/api/data/all/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }
    try {
        const jobsResult = await baserowServer.get(VAGAS_TABLE_ID, '');
        const allJobs = (jobsResult.results || []);
        const userJobs = allJobs.filter((job) => job.usuario && job.usuario.some((user) => user.id === parseInt(userId)));
        const userJobIds = new Set(userJobs.map(job => job.id));
        const jobsMapByTitle = new Map(userJobs.map((job) => [job.titulo.toLowerCase().trim(), job]));
        const jobsMapById = new Map(userJobs.map((job) => [job.id, job]));
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
        const allCandidatesRaw = [
            ...(regularCandidatesResult.results || []),
            ...(whatsappCandidatesResult.results || [])
        ];
        const userCandidatesRaw = allCandidatesRaw.filter((candidate) => {
            if (candidate.usuario && candidate.usuario.some((u) => u.id === parseInt(userId))) {
                return true;
            }
            if (candidate.vaga && typeof candidate.vaga === 'string') {
                const jobMatch = jobsMapByTitle.get(candidate.vaga.toLowerCase().trim());
                return !!jobMatch;
            }
            if (candidate.vaga && Array.isArray(candidate.vaga) && candidate.vaga.length > 0) {
                const vagaId = candidate.vaga[0].id;
                return userJobIds.has(vagaId);
            }
            return false;
        });
        const syncedCandidates = userCandidatesRaw.map((candidate) => {
            let vagaLink = null;
            if (candidate.vaga && typeof candidate.vaga === 'string') {
                const jobMatch = jobsMapByTitle.get(candidate.vaga.toLowerCase().trim());
                if (jobMatch) {
                    vagaLink = [{ id: jobMatch.id, value: jobMatch.titulo }];
                }
            }
            else if (candidate.vaga && Array.isArray(candidate.vaga) && candidate.vaga.length > 0) {
                const linkedVaga = candidate.vaga[0];
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
    }
    catch (error) {
        console.error('Erro ao buscar todos os dados (backend):', error);
        res.status(500).json({ error: 'Falha ao carregar dados.' });
    }
});
app.post('/api/upload-curriculums', upload.array('curriculumFiles'), async (req, res) => {
    const { jobId, userId } = req.body;
    const files = req.files;
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
                usuario: [parseInt(userId)],
                vaga: [parseInt(jobId)],
                score: null,
                resumo_ia: null,
                status: 'Triagem',
            };
            const createdCandidate = await baserowServer.post(CANDIDATOS_TABLE_ID, newCandidateData);
            newCandidateEntries.push(createdCandidate);
        }
        const jobInfo = await baserowServer.getRow(VAGAS_TABLE_ID, parseInt(jobId));
        const userInfo = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId));
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
        }
        else {
            res.json({ success: true, message: `${files.length} currículo(s) enviado(s), mas não foram para análise.`, newCandidates: newCandidateEntries });
        }
    }
    catch (error) {
        console.error('Erro no upload de currículos (backend):', error);
        res.status(500).json({ success: false, message: error.message || 'Falha ao fazer upload dos currículos.' });
    }
});
// Rota alternativa para upload de currículos (compatibilidade com frontend)
app.post('/api/upload', upload.any(), async (req, res) => {
    console.log('[UPLOAD DEBUG] Dados recebidos:', {
        body: req.body,
        files: req.files ? req.files.length : 0,
        filesInfo: req.files ? req.files.map(f => ({ name: f.originalname, size: f.size, fieldname: f.fieldname })) : []
    });
    const { jobId, userId } = req.body;
    const files = req.files;
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
                usuario: [parseInt(userId)],
                vaga: [parseInt(jobId)],
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
        const jobInfo = await baserowServer.getRow(VAGAS_TABLE_ID, parseInt(jobId));
        const userInfo = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId));
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
        }
        else {
            res.json({ success: true, message: `${files.length} currículo(s) enviado(s), mas não foram para análise.`, newCandidates: newCandidateEntries });
        }
    }
    catch (error) {
        console.error('Erro no upload de currículos (backend /api/upload):', error);
        res.status(500).json({ success: false, message: error.message || 'Falha ao fazer upload dos currículos.' });
    }
});
app.get('/api/schedules/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }
    try {
        const { results } = await baserowServer.get(AGENDAMENTOS_TABLE_ID, `?filter__Candidato__usuario__link_row_has=${userId}`);
        res.json({ success: true, results: results || [] });
    }
    catch (error) {
        console.error('Erro ao buscar agendamentos (backend):', error);
        res.status(500).json({ success: false, message: 'Falha ao buscar agendamentos.' });
    }
});
app.get('/api/google/auth/connect', (req, res) => {
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
app.get('/api/google/auth/callback', async (req, res) => {
    const { code, state: userId } = req.query;
    const closePopupScript = `<script>window.close();</script>`;
    if (!code || !userId) {
        return res.send(closePopupScript);
    }
    try {
        console.log('[Google Auth Callback] Recebendo callback...');
        console.log('[Google Auth Callback] Code:', code);
        console.log('[Google Auth Callback] UserId:', userId);
        const { tokens } = await oauth2Client.getToken(code);
        console.log('[Google Auth Callback] Tokens recebidos:', {
            access_token: tokens.access_token ? 'presente' : 'ausente',
            refresh_token: tokens.refresh_token ? 'presente' : 'ausente'
        });
        const { refresh_token } = tokens;
        if (refresh_token) {
            console.log('[Google Auth Callback] Salvando refresh_token para userId:', userId);
            await baserowServer.patch(USERS_TABLE_ID, parseInt(userId), {
                google_refresh_token: refresh_token
            });
            console.log('[Google Auth Callback] Refresh token salvo com sucesso');
        }
        else {
            console.warn('[Google Auth Callback] Nenhum refresh_token recebido - usuário pode já ter autorizado antes');
        }
        oauth2Client.setCredentials(tokens);
        res.send(closePopupScript);
    }
    catch (error) {
        console.error('[Google Auth Callback] ERRO DETALHADO na troca de código por token:', error.response?.data || error.message);
        console.error('[Google Auth Callback] Stack trace:', error.stack);
        res.status(500).send(`<html><body><h1>Erro na Autenticação</h1><p>Detalhes: ${error.message}</p></body></html>`);
    }
});
app.post('/api/google/auth/disconnect', async (req, res) => {
    const { userId } = req.body;
    await baserowServer.patch(USERS_TABLE_ID, parseInt(userId), { google_refresh_token: null });
    res.json({ success: true, message: 'Conta Google desconectada.' });
});
app.get('/api/google/auth/status', async (req, res) => {
    const { userId } = req.query;
    if (!userId)
        return res.status(400).json({ error: 'userId é obrigatório' });
    try {
        const userResponse = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId));
        const isConnected = !!userResponse.google_refresh_token;
        res.json({ isConnected });
    }
    catch (error) {
        console.error('Erro ao verificar status da conexão Google para o usuário:', userId, error);
        res.status(500).json({ error: 'Erro ao verificar status da conexão.' });
    }
});
app.post('/api/google/calendar/create-event', async (req, res) => {
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
    }
    catch (error) {
        console.error('Erro ao criar evento no Google Calendar:', error);
        res.status(500).json({ success: false, message: 'Falha ao criar evento.' });
    }
});
app.post('/api/behavioral-test/generate', async (req, res) => {
    const { candidateId, recruiterId } = req.body;
    console.log(`[Behavioral Test] Requisição recebida:`, { candidateId, recruiterId });
    if (!candidateId || !recruiterId) {
        console.log(`[Behavioral Test] Erro: dados obrigatórios faltando`);
        return res.status(400).json({ error: 'ID do candidato e do recrutador são obrigatórios.' });
    }
    try {
        console.log(`[Behavioral Test] Criando entrada na tabela ${TESTE_COMPORTAMENTAL_TABLE_ID}`);
        const newTestEntry = await baserowServer.post(TESTE_COMPORTAMENTAL_TABLE_ID, {
            candidato: [parseInt(candidateId)],
            recrutador: [parseInt(recruiterId)],
            status: 'Pendente',
        });
        console.log(`[Behavioral Test] Teste criado com sucesso:`, newTestEntry.id);
        res.status(201).json({ success: true, testId: newTestEntry.id });
    }
    catch (error) {
        console.error('Erro ao gerar link do teste comportamental:', error);
        res.status(500).json({ error: 'Não foi possível gerar o link do teste.' });
    }
});
app.patch('/api/behavioral-test/submit', async (req, res) => {
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
        }
        else if (typeof n8nResultData === 'object' && n8nResultData !== null && !Array.isArray(n8nResultData)) {
            resultObject = n8nResultData;
        }
        else {
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
    }
    catch (error) {
        console.error(`[Teste ${testId}] Erro no fluxo síncrono do teste:`, error.message);
        await baserowServer.patch(TESTE_COMPORTAMENTAL_TABLE_ID, parseInt(testId), { status: 'Erro' }).catch(err => console.error("Falha ao atualizar status para Erro:", err));
        res.status(500).json({ error: error.message || 'Erro ao processar o teste.' });
    }
});
app.get('/api/public/behavioral-test/:testId', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Não foi possível buscar os dados do teste.' });
    }
});
app.get('/api/behavioral-test/results/recruiter/:recruiterId', async (req, res) => {
    const { recruiterId } = req.params;
    if (!recruiterId) {
        return res.status(400).json({ error: 'ID do recrutador é obrigatório.' });
    }
    try {
        const { results } = await baserowServer.get(TESTE_COMPORTAMENTAL_TABLE_ID, `?filter__recrutador__link_row_has=${recruiterId}&order_by=-data_de_resposta`);
        res.json({ success: true, data: results || [] });
    }
    catch (error) {
        console.error('Erro ao buscar resultados de testes:', error);
        res.status(500).json({ error: 'Não foi possível carregar os resultados.' });
    }
});
app.get('/api/behavioral-test/result/:testId', async (req, res) => {
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
    }
    catch (error) {
        console.error(`Erro ao buscar resultado do teste ${testId} (backend):`, error);
        res.status(500).json({ error: 'Não foi possível buscar o resultado do teste.' });
    }
});
app.listen(port, () => {
    const isProduction = process.env.NODE_ENV === 'production';
    console.log(`🚀 Backend rodando em ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
    console.log(`📡 Porta: ${port}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`🔗 Backend URL: ${process.env.BACKEND_URL || `http://localhost:${port}`}`);
    console.log(`🗄️  Baserow API: ${process.env.VITE_BASEROW_API_KEY ? 'Configurado' : 'NÃO CONFIGURADO'}`);
    console.log(`🤖 N8N Webhooks: ${process.env.TESTE_COMPORTAMENTAL_WEBHOOK_URL ? 'Configurado' : 'NÃO CONFIGURADO'}`);
    console.log('✅ Servidor pronto para receber requisições!');
});
