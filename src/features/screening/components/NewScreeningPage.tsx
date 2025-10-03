import React from 'react';
import NewScreeningChecklistPage from './NewScreeningChecklistPage';
import { JobPosting } from '../types';

interface RequirementsData {
  idade?: { min: string; max: string };
  sexo?: { tipo: string; justificativa: string };
  cnh?: string[];
  experiencia?: string;
  escolaridade?: string;
}

interface NewJobData {
  id?: number; // ID real do Baserow (quando disponível)
  titulo: string;
  endereco: string;
  modo_trabalho: 'presencial' | 'remoto' | 'hibrido';
  descricao: string;
  requisitos: RequirementsData;
  criado_em: string;
}

interface NewScreeningPageProps {
  onJobCreated: (newJob: JobPosting) => void;
  onCancel: () => void;
}

const NewScreeningPage: React.FC<NewScreeningPageProps> = ({
  onJobCreated,
  onCancel
}) => {
  const handleJobCreated = (newJobData: NewJobData) => {
    console.log('📥 NewScreeningPage recebeu:', newJobData);
    console.log('🆔 ID recebido:', newJobData.id);
    
    // Converter os dados do novo formato para o formato esperado
    const jobPosting: JobPosting = {
      id: newJobData.id || Date.now(), // Usar ID real se disponível, senão temporário
      order: '',
      titulo: newJobData.titulo,
      descricao: newJobData.descricao,
      endereco: newJobData.endereco,
      requisitos_obrigatorios: formatRequirements(newJobData.requisitos).join('; '),
      requisitos_desejaveis: '',
      criado_em: newJobData.criado_em,
      usuario: [{ id: 1, value: 'Sistema' }],
      candidateCount: 0,
      averageScore: 0
    };

    console.log('📤 NewScreeningPage passando para App.tsx:', jobPosting);
    console.log('🆔 ID final:', jobPosting.id);
    
    onJobCreated(jobPosting);
  };

  const formatRequirements = (requisitos: RequirementsData): string[] => {
    const requirements: string[] = [];
    
    if (requisitos.idade) {
      requirements.push(`Idade: ${requisitos.idade.min} a ${requisitos.idade.max} anos`);
    }
    
    if (requisitos.sexo) {
      requirements.push(`Gênero: ${requisitos.sexo.tipo}`);
    }
    
    if (requisitos.cnh && requisitos.cnh.length > 0) {
      requirements.push(`CNH: ${requisitos.cnh.join(', ')}`);
    }
    
    if (requisitos.experiencia) {
      requirements.push(`Experiência: ${requisitos.experiencia}`);
    }
    
    if (requisitos.escolaridade) {
      requirements.push(`Escolaridade: ${requisitos.escolaridade}`);
    }

    return requirements;
  };

  return (
    <NewScreeningChecklistPage
      onJobCreated={handleJobCreated}
      onCancel={onCancel}
    />
  );
};

export default NewScreeningPage;