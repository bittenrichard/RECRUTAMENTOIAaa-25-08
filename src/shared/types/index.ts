// Caminho: src/shared/types/index.ts
// SUBSTITUA O CONTEÚDO INTEIRO DESTE ARQUIVO

export type PageKey = 
  'login' | 
  'signup' | 
  'dashboard' | 
  'new-screening' | 
  'edit-screening' | 
  'results' | 
  'settings' | 
  'database' | 
  'agenda' |
  'behavioral-test' |
  'behavioral-result';

export interface Candidate {
  id: number;
  order: string;
  nome: string;
  email?: string;
  telefone: string | null;
  score: number | null;
  resumo_ia: string | null;
  data_triagem: string;
  vaga: { id: number; value: string }[] | null;
  usuario: { id: number; value: string }[] | null;
  curriculo?: { url: string; name: string }[] | null;
  cidade?: string;
  bairro?: string;
  idade?: number;
  sexo?: string;
  escolaridade?: string;
  status?: { id: number; value: 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado' } | null;
  behavioral_test_status?: 'Concluído' | 'Pendente' | 'Processando' | 'Erro' | null;
  resumo_perfil?: string | null;
  perfil_executor?: number | null;
  perfil_comunicador?: number | null;
  perfil_planejador?: number | null;
  perfil_analista?: number | null;
}

export interface Job {
    id: number;
    order: string;
    titulo: string;
    descricao?: string;
    cidade?: string;
    modalidade?: { id: number; value: string };
    status?: { id: number; value: string };
}