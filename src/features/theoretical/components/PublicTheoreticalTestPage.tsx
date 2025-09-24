// Local: src/features/theoretical/components/PublicTheoreticalTestPage.tsx

import React from 'react';
import { TheoreticalTestPage } from '../index';

interface PublicTheoreticalTestPageProps {
  candidateId: string;
}

const PublicTheoreticalTestPage: React.FC<PublicTheoreticalTestPageProps> = ({ candidateId }) => {
  const handleTestCompleted = (score: number) => {
    // Mostrar resultado e agradecimento
    alert(`Prova finalizada! Pontuação: ${score} pontos. Obrigado por participar!`);
  };

  const handleTestNotFound = () => {
    // Mostrar mensagem de erro
    alert('Prova não encontrada ou já finalizada.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TheoreticalTestPage
        candidateId={candidateId}
        onTestCompleted={handleTestCompleted}
        onTestNotFound={handleTestNotFound}
      />
    </div>
  );
};

export default PublicTheoreticalTestPage;