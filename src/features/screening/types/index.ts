// Local: src/features/screening/types/index.ts

// Interface para requisitos hierárquicos (espelhando o backend)
export interface RequirementsData {
  // Dados básicos
  idade?: { min: string; max: string } | null;
  
  // Modalidade de trabalho (salvo nos requisitos_json)
  modo_trabalho?: 'presencial' | 'remoto' | 'hibrido' | null;
  
  // Localização & Mobilidade
  cidade_estado?: { cidade: string; estado: string; regioes: string[] } | null;
  distancia?: { maxima: string; calculo_automatico: boolean } | null;
  cnh?: string[] | null;
  
  // Formação Acadêmica
  escolaridade_minima?: string | null;
  area_formacao?: string[] | null;
  cursos_complementares?: string[] | null;
  pos_graduacao?: { nivel: string; obrigatorio: boolean } | null;
  
  // Histórico Profissional
  tempo_total_experiencia?: { minimo: string; preferencial: string } | null;
  tempo_funcao_especifica?: { funcao: string; tempo_minimo: string } | null;
  experiencia_setor?: string[] | null;
  porte_empresa?: string[] | null;
  cargos_lideranca?: { tamanho_equipe: string; nivel: string } | null;
  
  // Habilidades Técnicas
  tecnologias_softwares?: {nome: string, nivel: string, obrigatorio: boolean}[] | null;
  idiomas?: {idioma: string, nivel: string, obrigatorio: boolean}[] | null;
  certificacoes_tecnicas?: {nome: string, obrigatorio: boolean}[] | null;
  registros_profissionais?: string[] | null;
  
  // Soft Skills
  soft_skills?: string[] | null;
}

// Representa uma Vaga como vem da API do Baserow
export interface JobPosting {
  id: number;
  order: string;
  titulo: string;
  descricao: string;
  endereco: string;
  modo_trabalho?: 'presencial' | 'remoto' | 'hibrido';
  requisitos_json?: string; // JSON string dos RequirementsData
  requisitos_obrigatorios: string; // Campo legado
  requisitos_desejaveis: string; // Campo legado
  criado_em: string;
  usuario: { id: number; value: string }[];
  // Campos que calcularemos depois
  candidateCount?: number;
  averageScore?: number;
}

// Representa os dados do formulário de criação/edição de vaga (NOVA ESTRUTURA)
export interface JobFormData {
  // Dados básicos
  titulo: string;
  descricao: string;
  endereco: string;
  modo_trabalho: 'presencial' | 'remoto' | 'hibrido';
  
  // Requisitos estruturados
  requisitos: RequirementsData;
  
  // Campos legados para compatibilidade
  requiredSkills?: string;
  desiredSkills?: string;
}

// Dados mínimos para criar vaga (compatibilidade com código antigo)
export interface JobFormDataLegacy {
  jobTitle: string;
  jobDescription: string;
  endereco: string;
  requiredSkills: string;
  desiredSkills: string;
}