import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, List, UploadCloud, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import CandidateTable from './CandidateTable';
import KanbanBoard from './KanbanBoard';
import { Candidate, CandidateStatus } from '../../../shared/types/index';
import { useAuth } from '../../auth/hooks/useAuth';
import CandidateDetailModal from './CandidateDetailModal';
import ScheduleModal from '../../agenda/components/ScheduleModal';
import { useGoogleAuth } from '../../../shared/hooks/useGoogleAuth';
import { useDataStore } from '../../../shared/store/useDataStore';
import UploadModal from './UploadModal';
import VideoUploadModal from './VideoUploadModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

type ViewMode = 'table' | 'kanban';

interface SortConfig {
  key: 'nome' | 'score';
  direction: 'ascending' | 'descending';
}

const ResultsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { isGoogleConnected } = useGoogleAuth();
  const { jobs, candidates, updateCandidateStatusInStore, fetchAllData } = useDataStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [candidateToSchedule, setCandidateToSchedule] = useState<Candidate | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); 
  const [isVideoUploadModalOpen, setIsVideoUploadModalOpen] = useState(false);
  const [candidateForVideo, setCandidateForVideo] = useState<Candidate | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'score', direction: 'descending' });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const selectedJob = useMemo(() => {
    if (!jobId) return null;
    return jobs.find(j => j.id === parseInt(jobId, 10)) || null;
  }, [jobId, jobs]);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScrollability();
      el.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      
      const observer = new MutationObserver(checkScrollability);
      observer.observe(el, { childList: true, subtree: true });

      return () => {
        el.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
        observer.disconnect();
      };
    }
  }, [candidates, checkScrollability]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const jobCandidates = useMemo(() => {
    if (!selectedJob) return [];
    
    const filtered = candidates.filter(c => 
      c.vaga && c.vaga.some(v => v.id === selectedJob.id)
    );

    return [...filtered].sort((a, b) => {
      const aValue = sortConfig.key === 'score' ? (a.score ?? -1) : a.nome;
      const bValue = sortConfig.key === 'score' ? (b.score ?? -1) : b.nome;

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [selectedJob, candidates, sortConfig]);
  
  const handleRequestSort = (key: 'nome' | 'score') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleUpdateCandidateStatus = useCallback(async (candidateId: number, newStatus: CandidateStatus) => {
    if (!profile) return;
    
    updateCandidateStatusInStore(candidateId, newStatus);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/candidates/${candidateId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Falha na atualização do status no servidor');
      
    } catch (error) {
      console.error('Erro ao atualizar status do candidato:', error);
      if(profile) await fetchAllData(profile);
    }
  }, [profile, fetchAllData, updateCandidateStatusInStore]);
  
  const handleScheduleSubmit = async (details: { start: Date; end: Date; title: string; details: string; saveToGoogle: boolean }) => {
    if (!candidateToSchedule || !selectedJob || !profile) return;
    
    if (details.saveToGoogle && !isGoogleConnected) {
        alert("Por favor, conecte a sua conta Google em 'Configurações' para agendar no Google Calendar.");
        return;
    }
  
    try {
        const response = await fetch(`${API_BASE_URL}/api/google/calendar/create-event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: profile.id,
                eventData: {
                    start: details.start.toISOString(), end: details.end.toISOString(),
                    title: details.title, details: details.details,
                },
                candidate: candidateToSchedule, job: selectedJob,
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Falha ao criar evento.');
        alert('Entrevista agendada com sucesso!');
        setIsScheduleModalOpen(false);
    } catch (error: any) {
        console.error('Erro ao agendar entrevista:', error);
        alert(error.message);
    }
  };

  const handleViewDetails = (candidate: Candidate) => setSelectedCandidate(candidate);
  const handleCloseDetailModal = () => setSelectedCandidate(null);
  const handleOpenScheduleModal = (candidate: Candidate) => {
    setCandidateToSchedule(candidate);
    setIsScheduleModalOpen(true);
  };

  const handleUpdateLastContact = async (candidateId: number) => {
    if (!profile) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/candidates/${candidateId}/update-contact`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });

      if (!response.ok) throw new Error('Falha na atualização da data de contato');
      
      // Atualizar os dados para refletir a mudança
      await fetchAllData(profile);
      
    } catch (error) {
      console.error('Erro ao atualizar data de contato:', error);
      alert('Erro ao atualizar data de contato');
    }
  };

  const handleVideoUploaded = async () => {
    if (profile) {
      await fetchAllData(profile);
    }
    setIsVideoUploadModalOpen(false);
    setCandidateForVideo(null);
  };
  
  if (!selectedJob) {
    return (
      <div className="p-10 text-center text-gray-500 flex flex-col items-center justify-center h-full">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h3 className="text-xl font-semibold">Vaga não encontrada</h3>
        <p>A vaga que você está tentando acessar não existe ou foi removida.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Voltar para o Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="fade-in h-full flex flex-col">
        <div className="flex-shrink-0 space-y-4">
          <div>
            <h3 className="text-2xl font-semibold text-gray-800">Resultados: {selectedJob.titulo}</h3>
            <p className="text-gray-600 mt-1">Gerencie os candidatos da sua vaga.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <button onClick={() => setIsUploadModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
              <UploadCloud size={16} /> Fazer Upload
            </button>
            <div className="w-full sm:w-auto flex items-center bg-white border p-1 rounded-lg">
              <button onClick={() => setViewMode('table')} className={`w-1/2 sm:w-auto p-2 rounded-md ${viewMode === 'table' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}><List size={20} className="mx-auto" /></button>
              <button onClick={() => setViewMode('kanban')} className={`w-1/2 sm:w-auto p-2 rounded-md ${viewMode === 'kanban' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}><LayoutGrid size={20} className="mx-auto" /></button>
            </div>
          </div>
        </div>

        <div className="flex-1 mt-6 min-h-0 relative">
          {viewMode === 'kanban' && canScrollLeft && (
            <button onClick={() => handleScroll('left')} className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white p-2 rounded-full shadow-lg border hover:bg-gray-100" aria-label="Rolar para a esquerda"><ChevronLeft size={24} /></button>
          )}

          {viewMode === 'table' ? (
              <div className="bg-white rounded-lg shadow overflow-auto h-full">
                <CandidateTable 
                  candidates={jobCandidates} 
                  onViewDetails={handleViewDetails} 
                  requestSort={handleRequestSort} 
                  sortConfig={sortConfig}
                  onUpdateLastContact={handleUpdateLastContact}
                />
              </div>
          ) : (
            <KanbanBoard 
              ref={scrollContainerRef} 
              candidates={jobCandidates} 
              onUpdateStatus={handleUpdateCandidateStatus} 
              onViewDetails={handleViewDetails} 
              onScheduleInterview={handleOpenScheduleModal}
              onUpdateLastContact={handleUpdateLastContact}
            />
          )}

          {viewMode === 'kanban' && canScrollRight && (
            <button onClick={() => handleScroll('right')} className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white p-2 rounded-full shadow-lg border hover:bg-gray-100" aria-label="Rolar para a direita"><ChevronRight size={24} /></button>
          )}
        </div>
      </div>

      {selectedCandidate && (
        <CandidateDetailModal 
          candidate={selectedCandidate} 
          onClose={handleCloseDetailModal}
          onScheduleInterview={handleOpenScheduleModal}
          onUpdateStatus={handleUpdateCandidateStatus}
          onDataSynced={() => profile && fetchAllData(profile)}
        />
      )}
      {isScheduleModalOpen && candidateToSchedule && (
        <ScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          onSubmit={handleScheduleSubmit}
          candidate={candidateToSchedule}
          job={selectedJob}
          isGoogleConnected={isGoogleConnected}
        />
      )}
      {isUploadModalOpen && (
        <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} selectedJob={selectedJob} />
      )}
      {isVideoUploadModalOpen && candidateForVideo && (
        <VideoUploadModal
          isOpen={isVideoUploadModalOpen}
          onClose={() => setIsVideoUploadModalOpen(false)}
          candidate={candidateForVideo}
          onVideoUploaded={handleVideoUploaded}
        />
      )}
    </>
  );
};

export default ResultsPage;