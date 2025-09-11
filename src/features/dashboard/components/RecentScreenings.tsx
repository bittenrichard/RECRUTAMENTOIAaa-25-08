import React from 'react';
import { PlusCircle, Search, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { JobPosting } from '../../screening/types';

interface RecentScreeningsProps {
  jobs: (JobPosting & { candidateCount?: number; averageScore?: number })[];
  onViewResults: (job: JobPosting) => void;
  onOpenDeleteModal: (job: JobPosting) => void;
  onNewScreening: () => void;
  onEditJob: (job: JobPosting) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const RecentScreenings: React.FC<RecentScreeningsProps> = ({
  jobs,
  onViewResults,
  onOpenDeleteModal,
  onNewScreening,
  onEditJob,
  searchTerm,
  setSearchTerm,
}) => {
  const [openMenuId, setOpenMenuId] = React.useState<number | null>(null);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Triagens Recentes</h2>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por vaga..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={onNewScreening}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <PlusCircle size={16} /> Nova Triagem
          </button>
        </div>
      </div>

      {/* Container para a lista/tabela */}
      <div>
        {/* Vista em cards para mobile */}
        <div className="sm:hidden space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-gray-50 border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{job.titulo}</h3>
                  <p className="text-sm text-gray-500">{job.status?.value || 'Ativa'}</p>
                </div>
                <div className="relative">
                  <button onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}>
                    <MoreVertical size={20} className="text-gray-500" />
                  </button>
                  {openMenuId === job.id && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                      <button onClick={() => { onViewResults(job); setOpenMenuId(null); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Eye size={14}/> Ver Resultados</button>
                      <button onClick={() => { onEditJob(job); setOpenMenuId(null); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Edit size={14}/> Editar</button>
                      <button onClick={() => { onOpenDeleteModal(job); setOpenMenuId(null); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"><Trash2 size={14}/> Excluir</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <div className="text-center">
                  <p className="font-semibold text-gray-800">{job.candidateCount ?? 0}</p>
                  <p className="text-gray-500">Candidatos</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800">{job.averageScore ?? 0}%</p>
                  <p className="text-gray-500">Score Médio</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vista em tabela para telas maiores */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaga</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidatos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score Médio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.titulo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.candidateCount ?? 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.averageScore ?? 0}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {job.status?.value || 'Ativa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <button onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}>
                      <MoreVertical size={20} className="text-gray-500 hover:text-gray-800" />
                    </button>
                    {openMenuId === job.id && (
                       <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                        <button onClick={() => { onViewResults(job); setOpenMenuId(null); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Eye size={14}/> Ver Resultados</button>
                        <button onClick={() => { onEditJob(job); setOpenMenuId(null); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Edit size={14}/> Editar</button>
                        <button onClick={() => { onOpenDeleteModal(job); setOpenMenuId(null); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"><Trash2 size={14}/> Excluir</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecentScreenings;