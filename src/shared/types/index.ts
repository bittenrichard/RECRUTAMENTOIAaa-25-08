// Tipos para melhorias do banco de talentos e vídeo de entrevista

export type CandidateStatus = 'Triagem' | 'Entrevista' | 'Entrevista por Vídeo' | 'Teste Teórico' | 'Teste Prático' | 'Aprovado' | 'Contratado' | 'Reprovado';

export interface CandidateVideo {
  name: string; // Nome do arquivo
  url: string; // URL do vídeo (Baserow ou storage externo)
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
  video_entrevista?: CandidateVideo[];
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

// ========================================
// TIPOS - SISTEMA DE PROVAS TEÓRICAS
// ========================================

export type QuestionType = 'verdadeiro_falso' | 'dissertativa' | 'multipla_escolha';
export type TestStatus = 'em_andamento' | 'finalizada' | 'expirada';

export interface Question {
  id?: string;
  tipo: QuestionType;
  enunciado: string;
  opcoes?: string[]; // Para múltipla escolha
  resposta_correta?: string; // Para verdadeiro/falso e múltipla escolha
  resposta_esperada?: string; // Para questões dissertativas
  pontuacao: number;
}

export interface TestModel {
  id?: string;
  nome: string;
  descricao: string;
  tempo_limite: number; // em minutos
  questoes: Question[];
  ativo: boolean;
  criado_por?: number; // ID do usuário que criou o modelo
  is_template?: boolean; // true se for um template (criado pelo usuário 1)
  created_at?: string;
  updated_at?: string;
}

export interface QuestionAnswer {
  questao_id: string;
  resposta: string;
  pontuacao_obtida?: number;
}

export interface AppliedTest {
  id?: string;
  candidato_id: string;
  modelo_prova_id: string;
  questoes_respostas: QuestionAnswer[];
  pontuacao_total?: number;
  status: TestStatus;
  data_inicio?: string;
  data_finalizacao?: string;
  tempo_restante?: number;
}

export interface CandidateQuestion extends Question {
  resposta_candidato?: string;
}

export interface CandidateTestData {
  id: string;
  modelo_nome: string;
  modelo_descricao: string;
  tempo_limite: number;
  tempo_restante: number;
  questoes: CandidateQuestion[];
  status: TestStatus;
  data_inicio: string;
}

export interface TestResult {
  id: string;
  modelo_nome: string;
  pontuacao_total: number;
  status: TestStatus;
  data_inicio: string;
  data_finalizacao?: string;
  tempo_restante?: number;
}

export interface TestSubmission {
  respostas: { questao_id: string; resposta: string }[];
}
