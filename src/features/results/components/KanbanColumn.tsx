// Caminho: src/features/results/components/KanbanColumn.tsx
// SUBSTITUA O CONTEÚDO INTEIRO DESTE ARQUIVO

import React from 'react';
import { useDrop } from 'react-dnd';
import { Candidate, CandidateStatus } from '../../../shared/types';
import CandidateCard from './CandidateCard';

interface KanbanColumnProps {
  columnId: CandidateStatus;
  title: string;
  candidates: Candidate[];
  onViewDetails: (candidate: Candidate) => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onUpdateStatus: (candidateId: number, newStatus: CandidateStatus) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ columnId, title, candidates, onViewDetails, onScheduleInterview, onUpdateStatus }) => {
    
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'candidateCard',
    drop: (item: { id: number }) => onUpdateStatus(item.id, columnId),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));
    
  return (
    // --- CORREÇÃO APLICADA AQUI ---
    // 1. Trocamos 'min-h-full' por 'h-full' para garantir que a coluna ocupe toda a altura disponível.
    <div className="bg-gray-100 rounded-lg p-4 w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col h-full shadow-md border">
      <h3 className="font-bold text-gray-800 mb-4 px-2 flex-shrink-0">{title} ({candidates.length})</h3>
      
      {/* 2. Este contêiner agora cresce para preencher o espaço e permite a rolagem vertical */}
      <div 
        ref={drop}
        className={`flex-grow min-h-0 overflow-y-auto hide-scrollbar p-2 rounded-md transition-colors duration-200 border-2 border-dashed
          ${isOver ? 'border-indigo-400 bg-indigo-50' : 'border-transparent'}
        `}
      >
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onViewDetails={onViewDetails}
            onScheduleInterview={onScheduleInterview}
          />
        ))}
      </div>
    </div>
  );
};

export default KanbanColumn;