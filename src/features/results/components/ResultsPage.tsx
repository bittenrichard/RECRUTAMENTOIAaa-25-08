// Local: src/features/results/components/ResultsPage.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LayoutGrid, List, UploadCloud } from 'lucide-react';
import CandidateTable from './CandidateTable';
import KanbanBoard from './KanbanBoard';
import { JobPosting } from '../../screening/types';
import { Candidate } from '../../../shared/types';
import { useAuth } from '../../auth/hooks/useAuth';
import CandidateDetailModal from './CandidateDetailModal';
import ScheduleModal from '../../agenda/components/ScheduleModal';
import { useGoogleAuth } from '../../../shared/hooks/useGoogleAuth';
import { useDataStore } from '../../../shared/store/useDataStore';
import UploadModal from './UploadModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

type ViewMode = 'table' | 'kanban';

interface SortConfig {
  key: 'nome' | 'score';
  direction: 'ascending' | 'descending';
}

interface ResultsPageProps {
  selectedJob: JobPosting | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ selectedJob }) => {
  const { profile } = useAuth();
  const { isGoogleConnected } = useGoogleAuth();
  const { candidates, updateCandidateStatusInStore, fetchAllData } = useDataStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [candidateToSchedule, setCandidateToSchedule] = useState<Candidate | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); 
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'score', direction: 'descending' });

  const jobCandidates = useMemo(() => {
    let filtered = selectedJob ? candidates.filter(c => c.vaga && c.vaga.some(v => v.id === selectedJob.id)) : [];
    
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || 0;
        const bValue = b[sortConfig.key] || 0;

        if (sortConfig.direction === 'ascending') {
          if (aValue < bValue) return -1;
          if (aValue > bValue) return 1;
          return 0;
        } else {
          if (aValue > bValue) return -1;
          if (aValue < bValue) return 1;
          return 0;
        }
      });
    }
    return filtered;
  }, [selectedJob, candidates, sortConfig]);
  
  const handleRequestSort = (key: 'nome' | 'score') => {
    let direction: 'ascending' | 'descending' = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const handleUpdateCandidateStatus = useCallback(async (candidateId: number, newStatus: 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado') => {
    updateCandidateStatusInStore(candidateId, newStatus);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/candidates/${candidateId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível atualizar o status.");
      }
    } catch (error: any) {
      console.error("Erro ao atualizar status do candidato:", error);
      alert("Não foi possível atualizar o status. Sincronizando dados...");
      if (profile) fetchAllData(profile); 
    }
  }, [profile, fetchAllData, updateCandidateStatusInStore]);

  const handleFilesSelected = async (files: FileList): Promise<void> => {
    if (!selectedJob || !profile) {
      setUploadError('Vaga ou perfil de usuário não selecionados.');
      return;
    }

    setIsProcessing(true);
    setUploadError(null);
    setUploadSuccessMessage(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('curriculumFiles', file));
      formData.append('jobId', String(selectedJob.id));
      formData.append('userId', String(profile.id));

      const response = await fetch(`${API_BASE_URL}/api/upload-curriculums`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ocorreu um erro durante o upload.');
      }
      
      await fetchAllData(profile);
      setUploadSuccessMessage(data.message);

    } catch (error: any) {
      setUploadError(error.message);
      console.error("Erro na requisição de upload:", error);
    } finally { 
      setIsProcessing(false); 
    }
  };
  
  const handleScheduleSubmit = async (details: { start: Date; end: Date; title: string; details: string; saveToGoogle: boolean }) => {
    if (!candidateToSchedule || !selectedJob || !profile) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/google/calendar/create-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          eventData: details,
          candidate: candidateToSchedule,
          job: selectedJob
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      alert("Entrevista agendada com sucesso!");
      await fetchAllData(profile);

    } catch (error: any) {
      alert(`Falha ao agendar: ${error.message}`);
    } finally {
      setIsScheduleModalOpen(false);
      setCandidateToSchedule(null);
    }
  };

  const handleViewDetails = (candidate: Candidate) => setSelectedCandidate(candidate);
  const handleCloseDetailModal = () => setSelectedCandidate(null);
  const handleOpenScheduleModal = (candidate: Candidate) => {
    if (!isGoogleConnected) { alert("Conecte sua conta Google em 'Configurações' para agendar."); return; }
    setCandidateToSchedule(candidate);
    setIsScheduleModalOpen(true);
  };
  
  if (!selectedJob) return <div className="p-10 text-center"><h3 className="text-xl font-semibold">Nenhuma vaga selecionada</h3></div>;

  return (
    <>
      <div className="fade-in h-full flex flex-col">
        <div className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-semibold">Resultados: {selectedJob.titulo}</h3>
              <p className="text-gray-600">Arraste e solte os candidatos para gerenciar o fluxo.</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                  <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:bg-gray-200'}`}><LayoutGrid size={20} /></button>
                  <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:bg-gray-200'}`}><List size={20} /></button>
               </div>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors bg-indigo-600 text-white" 
                >
                  <UploadCloud size={18} />
                  Enviar Currículo
                </button>
            </div>
          </div>
        </div>
        <div className="flex-1 mt-6 min-h-0">
          {viewMode === 'table' ? (
              <CandidateTable 
                candidates={jobCandidates}
                onViewDetails={handleViewDetails} 
                requestSort={handleRequestSort}
                sortConfig={sortConfig}
              />
          ) : (
            <KanbanBoard candidates={jobCandidates} onUpdateStatus={handleUpdateCandidateStatus} onViewDetails={handleViewDetails} onScheduleInterview={handleOpenScheduleModal} />
          )}
        </div>
      </div>
      {selectedCandidate && (
        <CandidateDetailModal 
          candidate={selectedCandidate} 
          onClose={handleCloseDetailModal}
          onScheduleInterview={handleOpenScheduleModal}
          onUpdateStatus={handleUpdateCandidateStatus}
        />
      )}
      <ScheduleModal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} candidate={candidateToSchedule} onSchedule={handleScheduleSubmit} />
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadSuccessMessage(null);
          setUploadError(null);
        }}
        onFilesSelected={handleFilesSelected}
        isUploading={isProcessing}
        successMessage={uploadSuccessMessage}
        errorMessage={uploadError}
      />
    </>
  );
};

export default ResultsPage;