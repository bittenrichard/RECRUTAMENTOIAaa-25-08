import React from 'react';
import { Candidate } from '../../../shared/types';
import { ChevronUp, ChevronDown, User, Star, MoreVertical, RefreshCw } from 'lucide-react';

interface SortConfig {
  key: 'nome' | 'score';
  direction: 'ascending' | 'descending';
}

interface CandidateTableProps {
  candidates: Candidate[];
  onViewDetails: (candidate: Candidate) => void;
  requestSort: (key: 'nome' | 'score') => void;
  sortConfig: SortConfig;
  onUpdateLastContact?: (candidateId: number) => void;
}

const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
};

const CandidateTable: React.FC<CandidateTableProps> = ({ candidates, onViewDetails, requestSort, sortConfig, onUpdateLastContact }) => {
  const getSortIcon = (key: 'nome' | 'score') => {
    if (sortConfig.key !== key) {
      return <ChevronDown size={16} className="inline ml-1 opacity-40" />;
    }
    return sortConfig.direction === 'ascending' ? <ChevronUp size={16} className="inline ml-1" /> : <ChevronDown size={16} className="inline ml-1" />;
  };

  if (candidates.length === 0) {
    return <div className="p-8 text-center text-gray-500">Nenhum candidato encontrado para esta vaga.</div>;
  }
  
  return (
    <>
      {/* Vista em cards para Mobile */}
      <div className="md:hidden space-y-3 p-4">
        {candidates.map(candidate => (
          <div key={candidate.id} className="bg-white border rounded-lg p-4 shadow-sm" onClick={() => onViewDetails(candidate)}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-800">{candidate.nome}</p>
                <p className="text-sm text-gray-500">{candidate.status?.value || 'Triagem'}</p>
                {/* Entrevista por Vídeo */}
                <div className="mt-2">
                  <span className="block text-xs text-gray-400">Vídeo:</span>
                  {candidate.video_entrevista?.url ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600">✓ Enviado</span>
                      <a 
                        href={candidate.video_entrevista.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Assistir
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Aguardando</span>
                  )}
                </div>
                {/* Status Vídeo */}
                <div className="mt-1">
                  <span className="block text-xs text-gray-400">Status Vídeo: {candidate.video_entrevista?.status || 'Pendente'}</span>
                </div>
                {/* Última Atualização */}
                <div className="mt-1">
                  <span className="block text-xs text-gray-400">
                    Última Atualização: {candidate.ultima_atualizacao ? new Date(candidate.ultima_atualizacao).toLocaleDateString('pt-BR') : '—'}
                    {onUpdateLastContact && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateLastContact(candidate.id);
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Atualizar última data de contato"
                      >
                        <RefreshCw size={12} />
                      </button>
                    )}
                  </span>
                </div>
              </div>
              <div className={`flex items-center font-bold text-lg ${getScoreColor(candidate.score)}`}> 
                <Star size={16} className="mr-1 fill-current" />
                {candidate.score ?? 'N/A'}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vista em Tabela para Desktop */}
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => requestSort('nome')} className="flex items-center">
                  Candidato {getSortIcon('nome')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 <button onClick={() => requestSort('score')} className="flex items-center">
                  Score {getSortIcon('score')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrevista por Vídeo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Vídeo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Atualização</th>
              <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {candidates.map((candidate) => (
              <tr key={candidate.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onViewDetails(candidate)}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{candidate.nome}</div>
                      <div className="text-sm text-gray-500">{candidate.email || 'E-mail não disponível'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {candidate.status?.value || 'Triagem'}
                  </span>
                </td>
                {/* Score */}
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${getScoreColor(candidate.score)}`}>
                  {candidate.score !== null ? `${candidate.score}%` : 'N/A'}
                </td>
                {/* Entrevista por Vídeo */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {candidate.video_entrevista?.url ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600">✓ Enviado</span>
                      <a 
                        href={candidate.video_entrevista.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Assistir
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Aguardando</span>
                  )}
                </td>
                {/* Status Vídeo */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {candidate.video_entrevista?.status || 'Pendente'}
                  </span>
                </td>
                {/* Última Atualização */}
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>{candidate.ultima_atualizacao ? new Date(candidate.ultima_atualizacao).toLocaleDateString('pt-BR') : '—'}</span>
                    {onUpdateLastContact && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateLastContact(candidate.id);
                        }}
                        className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Atualizar última data de contato"
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-gray-400 hover:text-indigo-600">
                    <MoreVertical size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CandidateTable;