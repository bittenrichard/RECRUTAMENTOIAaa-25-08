// Caminho: src/features/results/components/KanbanBoard.tsx
// SUBSTITUA O CONTEÚDO INTEIRO DESTE ARQUIVO

import React, { forwardRef } from 'react';
import { Candidate, CandidateStatus } from '../../../shared/types';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  candidates: Candidate[];
  onUpdateStatus: (candidateId: number, newStatus: CandidateStatus) => void;
  onViewDetails: (candidate: Candidate) => void;
  onScheduleInterview: (candidate: Candidate) => void;
}

const columnsOrder: { id: CandidateStatus; title: string }[] = [
  { id: 'Triagem', title: 'Triagem' },
  { id: 'Entrevista por Vídeo', title: 'Entrevista por Vídeo' },
  { id: 'Teste Teórico', title: 'Teste Teórico' },
  { id: 'Teste Prático', title: 'Teste Prático' },
  { id: 'Contratado', title: 'Contratado' },
  { id: 'Reprovado', title: 'Reprovado' },
];

// --- ALTERAÇÃO APLICADA AQUI ---
// Envolvemos o componente com forwardRef para receber a ref do componente pai.
const KanbanBoard = forwardRef<HTMLDivElement, KanbanBoardProps>(
  ({ candidates, onUpdateStatus, onViewDetails, onScheduleInterview }, ref) => {
    
  const candidatesByColumn = columnsOrder.reduce((acc, col) => {
    const filterFn = (c: Candidate) => (col.id === 'Triagem')
      ? (!c.status || c.status.value === 'Triagem')
      : c.status?.value === col.id;
      
    acc[col.id] = candidates.filter(filterFn);
    return acc;
  }, {} as Record<CandidateStatus, Candidate[]>);

  return (
    // Atribuímos a ref ao div que tem o scroll horizontal.
    <div ref={ref} className="flex gap-6 pb-2 overflow-x-auto h-full flex-grow hide-scrollbar">
      {columnsOrder.map((col) => (
        <KanbanColumn 
          key={col.id}
          columnId={col.id} 
          title={col.title} 
          candidates={candidatesByColumn[col.id] || []} 
          onViewDetails={onViewDetails} 
          onScheduleInterview={onScheduleInterview} 
          onUpdateStatus={onUpdateStatus}
        />
      ))}
    </div>
  );
});

export default KanbanBoard;