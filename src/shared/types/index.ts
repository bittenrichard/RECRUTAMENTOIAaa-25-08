// Tipos para melhorias do banco de talentos e vídeo de entrevista

export type CandidateStatus = 'Triagem' | 'Entrevista' | 'Entrevista por Vídeo' | 'Teste Teórico' | 'Teste Prático' | 'Aprovado' | 'Contratado' | 'Reprovado';

export interface CandidateVideo {
  url: string; // URL do vídeo (Baserow ou storage externo)
  status: 'Pendente' | 'Enviado' | 'Aprovado' | 'Reprovado';
  dataEnvio?: string; // ISO date
}

export interface JobPosting {
  id: number;
  titulo: string;
  descricao?: string;
  value?: string; // usado em alguns contextos
  // outros campos da vaga
}

export interface Candidate {
  id: number;
  nome: string;
  email?: string;
  score: number | null;
  status?: { value: string };
  vaga?: JobPosting[]; // Array de vagas que o candidato se candidatou
  video_entrevista?: CandidateVideo;
  ultima_atualizacao?: string; // ISO date
  // Campos existentes que podem estar presentes
  telefone?: string;
  curriculo?: string;
  data_triagem?: string;
  respostas_comportamentais?: Record<string, unknown>;
  respostas_teoricas?: Record<string, unknown>;
  // Campos de perfil comportamental
  perfil_executor?: number;
  perfil_comunicador?: number;
  perfil_planejador?: number;
  perfil_analista?: number;
  // Campos de resumo e status
  resumo_ia?: string;
  resumo_perfil?: string;
  behavioral_test_status?: string;
  theoretical_test_status?: string;
  // Campos do banco de dados (CandidateDatabasePage)
  sexo?: string;
  escolaridade?: string;
  idade?: number;
  // Outros campos que podem existir
  value?: string; // usado em alguns contextos
}

export interface UserAutomationSettings {
  automacao_inativacao: boolean;
  periodo_inativacao_meses: number;
}
