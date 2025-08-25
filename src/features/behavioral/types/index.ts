// CÓDIGO COMPLETO DO NOVO ARQUIVO
export interface BehavioralTestResult {
    id: number;
    candidato: { id: number; value: string }[];
    recrutador: { id: number; value: string }[];
    data_de_resposta: string;
    status: 'Pendente' | 'Processando' | 'Concluído' | 'Erro';
    respostas: string; // JSON string
    perfil_executor: number | null;
    perfil_comunicador: number | null;
    perfil_planejador: number | null;
    perfil_analista: number | null;
    resumo_perfil: string | null;
    habilidades_comuns: string | null;
    indicadores: string | null;
}