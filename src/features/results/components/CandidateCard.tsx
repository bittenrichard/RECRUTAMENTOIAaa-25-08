// Caminho: src/features/results/components/CandidateCard.tsx
// SUBSTITUA O CONTEÚDO INTEIRO DESTE ARQUIVO

import React from 'react';
import { useDrag } from 'react-dnd';
import { Candidate } from '../../../shared/types/index';
import { GripVertical, CalendarPlus, Mail, CalendarDays, BrainCircuit, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CandidateCardProps {
  candidate: Candidate;
  onViewDetails: (candidate: Candidate) => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onUpdateLastContact?: (candidateId: number) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onViewDetails, onScheduleInterview, onUpdateLastContact }) => {
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100 text-gray-800';
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formattedTriagemDate = candidate.data_triagem 
    ? format(new Date(candidate.data_triagem), 'dd/MM/yyyy', { locale: ptBR }) 
    : 'N/A';

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'candidateCard',
    item: { id: candidate.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`bg-white rounded-lg border shadow-sm mb-4 group relative 
                  transition-all duration-200 ease-out 
                  hover:shadow-md hover:-translate-y-1
                  ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{ cursor: 'grab' }}
      onClick={() => onViewDetails(candidate)}
    >
      <div className="absolute top-2 right-2 p-1 text-gray-300 group-hover:text-gray-500">
        <GripVertical size={16} />
      </div>

      <div className="p-4 cursor-pointer">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-gray-900 pr-8">{candidate.nome}</h4>
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(candidate.score)}`}>
            {candidate.score ?? 'N/A'}%
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-2 space-y-1">
            {candidate.email && (
              <p className="flex items-center"><Mail size={14} className="mr-1.5 flex-shrink-0"/> {candidate.email}</p>
            )}
            <p className="flex items-center"><CalendarDays size={14} className="mr-1.5 flex-shrink-0"/> Triado em: {formattedTriagemDate}</p>
            
            {/* Vídeo da Entrevista - Status simples */}
            {candidate.video_entrevista && candidate.video_entrevista.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Vídeo:</span>
                <span className="text-xs text-green-600">✓ Enviado</span>
              </div>
            )}
            
            {/* Última Atualização */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Última Atualização:</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">
                  {candidate.ultima_atualizacao ? new Date(candidate.ultima_atualizacao).toLocaleDateString('pt-BR') : '—'}
                </span>
                {onUpdateLastContact && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateLastContact(candidate.id);
                    }}
                    className="p-0.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Atualizar última data de contato"
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
              </div>
            </div>
        </div>

        <p className="text-sm text-gray-600 mt-3 line-clamp-3 h-[60px]">
          {candidate.resumo_ia || 'Sem resumo disponível.'}
        </p>
      </div>

      <div className="border-t p-2 flex justify-between items-center">
        <div>
          {candidate.behavioral_test_status === 'Concluído' && (
            <div className="flex items-center gap-1 text-purple-600 px-2" title="Teste Comportamental Concluído">
              <BrainCircuit size={16} />
              <span className="text-xs font-semibold">Perfil</span>
            </div>
          )}
        </div>
        
        {candidate.status?.value === 'Entrevista' && (
          <button 
            onClick={(e) => { e.stopPropagation(); onScheduleInterview(candidate); }}
            className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 p-2 rounded-md hover:bg-indigo-50 transition-colors"
          >
            <CalendarPlus size={16} className="mr-2" />
            Agendar
          </button>
        )}
      </div>
    </div>
  );
};

export default CandidateCard;