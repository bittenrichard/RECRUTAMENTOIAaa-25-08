import React, { forwardRef } from 'react';
import { Candidate, CandidateStatus } from '../../../shared/types/index';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  candidates: Candidate[];
  onUpdateStatus: (candidateId: number, newStatus: CandidateStatus) => void;
  onViewDetails: (candidate: Candidate) => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onUpdateLastContact?: (candidateId: number) => void;
}

const KanbanBoard = forwardRef<HTMLDivElement, KanbanBoardProps>(
  ({ candidates, onUpdateStatus, onViewDetails, onScheduleInterview, onUpdateLastContact }, ref) => {
    
    const columnsOrder: CandidateStatus[] = [
      'Triagem',
      'Entrevista por Vídeo',
      'Teste Teórico',
      'Entrevista Presencial',
      'Teste Prático',
      'Contratado',
      'Reprovado'
    ];
    
    const columns = columnsOrder.reduce((acc, stage) => {
      acc[stage] = candidates.filter(c => c.status?.value === stage || (stage === 'Triagem' && !c.status));
      return acc;
    }, {} as { [key: string]: Candidate[] });

    return (
      <div 
        ref={ref} 
        className="flex gap-6 pb-4 overflow-x-auto h-full flex-grow hide-scrollbar snap-x snap-mandatory"
      >
        {columnsOrder.map((col) => (
          <KanbanColumn
            key={col}
            columnId={col}
            title={col}
            candidates={columns[col]}
            onViewDetails={onViewDetails}
            onScheduleInterview={onScheduleInterview}
            onUpdateStatus={onUpdateStatus}
            onUpdateLastContact={onUpdateLastContact}
          />
        ))}
      </div>
    );
  }
);

export default KanbanBoard;