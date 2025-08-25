// Caminho: src/shared/types/index.ts

// O tipo UserProfile permanece o mesmo.
export interface UserProfile {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  company_name?: string;
  google_calendar_integrated?: boolean;
}

// --- ALTERAÇÕES APLICADAS AQUI ---

// 1. Expandimos os status para incluir todo o novo funil.
export type CandidateStatus =
  | 'Triagem'
  | 'Entrevista por Vídeo'
  | 'Teste Teórico'
  | 'Teste Prático'
  | 'Contratado' // Novo status final de sucesso
  | 'Aprovado'   // Mantido para compatibilidade, mas pode ser removido
  | 'Reprovado'
  | 'Entrevista'; // Mantido para compatibilidade

// Interface para um ficheiro vindo do Baserow (usado para avatar e novos campos)
export interface BaserowFile {
  url: string;
  thumbnails: {
    small: { url: string; width: number; height: number };
    tiny: { url: string; width: number; height: number };
  };
  name: string;
  size: number;
  mime_type: string;
  is_image: boolean;
  image_width: number;
  image_height: number;
  uploaded_at: string;
}

// 2. Atualizamos a interface do Candidato para incluir os novos campos.
export interface Candidate {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  linkedin: string;
  curriculo_url: string;
  data_triagem: string;
  avatar: BaserowFile[];
  vaga_id: number[];
  status: { id: number; value: CandidateStatus };
  
  // Novos campos adicionados
  video_entrevista?: BaserowFile[];
  resultado_teste_teorico?: BaserowFile[];
  data_teste_pratico?: string; // A data virá como uma string no formato ISO
}