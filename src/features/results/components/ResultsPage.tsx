import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, List, UploadCloud, ChevronLeft, ChevronRight, AlertTriangle, Sparkles } from 'lucide-react';
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
import RejectionReasonModal from './RejectionReasonModal';
import { AutoMatchPopup } from '../../jobs/components/AutoMatchPopup';

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
  
  // Estados para reprovação
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [candidateToReject, setCandidateToReject] = useState<Candidate | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Estados para upload de currículos
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);

  // Estados para Auto-Match
  const [showAutoMatchPopup, setShowAutoMatchPopup] = useState(false);
  const [autoMatchResults, setAutoMatchResults] = useState<any>(null);
  const [executingAutoMatch, setExecutingAutoMatch] = useState(false);

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
    
    // Se o novo status for "Reprovado", abrir modal para motivo
    if (newStatus === 'Reprovado') {
      const candidate = candidates.find(c => c.id === candidateId);
      if (candidate) {
        setCandidateToReject(candidate);
        setShowRejectionModal(true);
        return; // Não atualizar ainda - esperar confirmação do modal
      }
    }
    
    // Para outros status, atualizar normalmente
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
  }, [profile, fetchAllData, updateCandidateStatusInStore, candidates]);

  // Funções para lidar com reprovação
  const handleRejectionConfirm = async (reason: string) => {
    if (!candidateToReject || !profile) return;
    
    setIsUpdatingStatus(true);
    
    try {
      // Atualizar status no store
      updateCandidateStatusInStore(candidateToReject.id, 'Reprovado');
      
      const response = await fetch(`${API_BASE_URL}/api/candidates/${candidateToReject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Reprovado',
          motivo_reprova: reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar status no servidor');
      }

      // Fechar modal
      setShowRejectionModal(false);
      setCandidateToReject(null);
      
      // Refresh data
      if (profile) await fetchAllData(profile);
      
    } catch (error) {
      console.error('Erro ao reprovar candidato:', error);
      // Reverter mudança no store em caso de erro
      if (profile) await fetchAllData(profile);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRejectionCancel = () => {
    setShowRejectionModal(false);
    setCandidateToReject(null);
  };
  
  const handleScheduleSubmit = async (details: { start: Date; end: Date; title: string; details: string; saveToGoogle: boolean }) => {
    console.log('[DEBUG] handleScheduleSubmit chamado:', {
      candidateToSchedule: candidateToSchedule?.nome,
      selectedJob: selectedJob?.titulo,
      profileId: profile?.id,
      isGoogleConnected,
      saveToGoogle: details.saveToGoogle
    });
    
    if (!candidateToSchedule || !selectedJob || !profile) {
      console.error('[DEBUG] Dados faltando:', { candidateToSchedule, selectedJob, profile });
      return;
    }
    
    if (details.saveToGoogle && !isGoogleConnected) {
        alert("Por favor, conecte a sua conta Google em 'Configurações' para agendar no Google Calendar.");
        return;
    }
  
    try {
        console.log('[DEBUG] Enviando requisição para criar evento:', {
          url: `${API_BASE_URL}/api/google/calendar/create-event`,
          payload: {
            userId: profile.id,
            eventData: {
              start: details.start.toISOString(), 
              end: details.end.toISOString(),
              title: details.title, 
              details: details.details,
            },
            candidate: candidateToSchedule, 
            job: selectedJob,
          }
        });
        
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
        console.log('[DEBUG] Resposta do servidor:', { status: response.status, data });
        
        if (!response.ok) throw new Error(data.message || 'Falha ao criar evento.');
        
        console.log('[DEBUG] Evento criado com sucesso!');
        console.log('[DEBUG] Disparando evento para refresh do Google Calendar...');
        
        // Disparar evento customizado para refresh
        window.dispatchEvent(new CustomEvent('refreshGoogleCalendar'));
        
        alert('Entrevista agendada com sucesso! Verifique a aba "Agenda" para ver o evento.');
        setIsScheduleModalOpen(false);
    } catch (error) {
        console.error('Erro ao agendar entrevista:', error);
        alert(error instanceof Error ? error.message : 'Erro desconhecido');
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

  const handleFilesSelected = async (files: FileList) => {
    if (!selectedJob || !profile) {
      setUploadErrorMessage('Erro: vaga ou usuário não selecionado');
      return;
    }
    
    setIsUploading(true);
    setUploadSuccessMessage(null);
    setUploadErrorMessage(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      formData.append('jobId', selectedJob.id.toString());
      formData.append('userId', profile.id.toString());

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload dos currículos');
      }

      // Sucesso no upload
      setUploadSuccessMessage(`${files.length} curriculo(s) enviado(s) com sucesso!`);
      
      // Atualizar dados após upload
      await fetchAllData(profile);
      
      // Fechar modal após 2 segundos
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadSuccessMessage(null);
      }, 2000);

    } catch (error: unknown) {
      console.error('Erro no upload:', error);
      setUploadErrorMessage(
        error instanceof Error ? error.message : 'Erro desconhecido no upload'
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Função para executar Auto-Match
  const handleExecuteAutoMatch = async () => {
    if (!profile || !jobId || executingAutoMatch) {
      console.log('⚠️ Auto-Match bloqueado:', { profile: !!profile, jobId, executingAutoMatch });
      return;
    }
    
    console.log('🚀 Iniciando Auto-Match...', { jobId, userId: profile.id });
    setExecutingAutoMatch(true);
    
    try {
      console.log('📡 Fazendo requisição para:', `${API_BASE_URL}/api/auto-match/execute`);
      
      const response = await fetch(`${API_BASE_URL}/api/auto-match/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: parseInt(jobId),
          userId: profile.id 
        })
      });

      console.log('📥 Resposta recebida:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro na resposta:', errorData);
        throw new Error(`Erro ${response.status}: ${errorData.error || response.statusText}`);
      }

      const results = await response.json();
      console.log('📊 Resultados:', results);
      
      if (results.success) {
        console.log('✅ Auto-Match concluído!', {
          candidatosAnalisados: results.data.totalCandidatesAnalyzed,
          matchesEncontrados: results.data.matchesFound
        });
        
        if (results.data.matchesFound === 0) {
          alert(`Auto-Match concluído!\n\nAnalisados: ${results.data.totalCandidatesAnalyzed} candidatos\nMatches encontrados: 0\n\n${results.data.message || 'Nenhum candidato atingiu o score mínimo de 70%.'}`);
        } else {
          setAutoMatchResults(results.data);
          setShowAutoMatchPopup(true);
        }
        
        // Recarregar dados dos candidatos (scores foram atualizados)
        await fetchAllData(profile);
      } else {
        console.error('❌ Auto-Match falhou:', results.error);
        alert('Erro ao executar auto-match: ' + (results.error || 'Erro desconhecido'));
      }
      
    } catch (error) {
      console.error('❌ Erro no auto-match:', error);
      alert('Erro ao executar auto-match: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setExecutingAutoMatch(false);
      console.log('🏁 Auto-Match finalizado');
    }
  };

  const handleContactCandidate = async (candidateId: number) => {
    try {
      console.log('📞 Contatar candidato:', candidateId);
      // Implementar lógica de contato via WhatsApp
    } catch (error) {
      console.error('Erro ao contatar candidato:', error);
    }
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
            <div className="flex gap-2">
              <button 
                onClick={() => setIsUploadModalOpen(true)} 
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <UploadCloud size={16} /> Fazer Upload
              </button>
              
              <button 
                onClick={handleExecuteAutoMatch}
                disabled={executingAutoMatch}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles size={16} className={executingAutoMatch ? 'animate-spin' : ''} />
                {executingAutoMatch ? 'Analisando...' : 'Auto-Match com IA'}
              </button>
            </div>
            
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
          onSchedule={handleScheduleSubmit}
          candidate={candidateToSchedule}
        />
      )}
      {isUploadModalOpen && (
        <UploadModal 
          isOpen={isUploadModalOpen} 
          onClose={() => setIsUploadModalOpen(false)} 
          onFilesSelected={handleFilesSelected}
          isUploading={isUploading}
          successMessage={uploadSuccessMessage}
          errorMessage={uploadErrorMessage}
        />
      )}
      {isVideoUploadModalOpen && candidateForVideo && (
        <VideoUploadModal
          isOpen={isVideoUploadModalOpen}
          onClose={() => setIsVideoUploadModalOpen(false)}
          candidate={candidateForVideo}
          onVideoUploaded={handleVideoUploaded}
        />
      )}
      {showRejectionModal && candidateToReject && (
        <RejectionReasonModal
          isOpen={showRejectionModal}
          candidateName={candidateToReject.nome}
          onConfirm={handleRejectionConfirm}
          onCancel={handleRejectionCancel}
          isLoading={isUpdatingStatus}
        />
      )}
      
      {/* Auto-Match Popup */}
      {showAutoMatchPopup && autoMatchResults && (
        <AutoMatchPopup
          isOpen={showAutoMatchPopup}
          onClose={() => setShowAutoMatchPopup(false)}
          jobData={{
            cargo: selectedJob.titulo,
            titulo: selectedJob.titulo,
            empresa: 'Sua Empresa' // Pode pegar de selectedJob se tiver
          }}
          matchResults={autoMatchResults}
          onContactCandidate={handleContactCandidate}
        />
      )}
    </>
  );
};

export default ResultsPage;