import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, User, Star, Briefcase, FileText, Download, CalendarPlus, ChevronDown, RefreshCcw, Mail, BrainCircuit, UploadCloud, Video, Loader2, ClipboardList, MessageCircle, AlertCircle, BookOpen, Clock, ChevronRight, Eye, Trash2, Edit, Check } from 'lucide-react';
import { Candidate, CandidateStatus } from '../../../shared/types/index';
import { useAuth } from '../../auth/hooks/useAuth';
import ProfileChart from '../../behavioral/components/ProfileChart';
import { formatPhoneNumberForWhatsApp } from '../../../shared/utils/formatters';
import { generateWhatsAppUrl } from '../../../shared/utils/whatsappMessages';
import RejectionReasonModal from './RejectionReasonModal';
import { useToast } from '../../../shared/hooks/useToast';
import { ToastContainer } from '../../../shared/components/Toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface TheoreticalModel {
  id: string;
  nome: string;
  ativo: boolean;
  descricao?: string;
  tempo_limite?: number;
  questoes?: unknown;
}

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onUpdateStatus: (candidateId: number, newStatus: CandidateStatus) => void;
  onDataSynced: () => void;
}

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ candidate, onClose, onScheduleInterview, onUpdateStatus, onDataSynced }) => {
  // Função para extrair valor seguro de campos que podem vir como objetos {id, value, color}
  const getSafeValue = (field: unknown): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && field !== null && 'value' in field) {
      return String((field as { value?: unknown }).value || '');
    }
    return String(field);
  };

  // Função para determinar se uma prova está concluída (compatível com boolean e string)
  const isTestCompleted = (status: unknown): boolean => {
    if (typeof status === 'boolean') {
      return status === false; // false = finalizada no novo sistema
    }
    if (typeof status === 'string') {
      return status === 'Concluído' || status === 'Concluida';
    }
    // Tratar objeto do Baserow: { id, value, color }
    if (typeof status === 'object' && status !== null) {
      const statusObj = status as { value?: string };
      return statusObj.value === 'Concluído' || statusObj.value === 'Concluida';
    }
    return false;
  };

  // Função para formatar o status da prova
  const formatTestStatus = (status: unknown): string => {
    return isTestCompleted(status) ? 'Concluída' : 'Pendente';
  };

  const { profile } = useAuth();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isGeneratingTheoreticalLink, setIsGeneratingTheoreticalLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generatedTheoreticalLink, setGeneratedTheoreticalLink] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyTheoreticalSuccess, setCopyTheoreticalSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState< 'video' | 'test' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [theoreticalModels, setTheoreticalModels] = useState<TheoreticalModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [theoreticalTestResults, setTheoreticalTestResults] = useState<{
    id: number;
    modelo_nome?: string;
    status: string;
    pontuacao_total?: number;
    pontuacao?: number;
    acertos?: number;
    total_questoes?: number;
    data_finalizacao?: string;
  }[]>([]);
  const [isLoadingTheoreticalResults, setIsLoadingTheoreticalResults] = useState(false);
  const [interviewNotes, setInterviewNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { toasts, showSuccess, showError, showWarning, closeToast } = useToast();
  
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 🔧 NOVA ABORDAGEM: Usar dados que já vêm com o candidato (seguindo padrão do teste comportamental)
  const loadTheoreticalTestResults = useCallback(async () => {
    if (!candidate) return;
    setIsLoadingTheoreticalResults(true);
    
    try {
      console.log('🔍 Carregando provas teóricas do candidato (dados já disponíveis):', candidate.id);
      
      // Verificar se o candidato tem provas teóricas nos dados
      const theoreticalTests = (candidate as any).theoretical_tests || [];
      console.log('📊 Provas teóricas encontradas nos dados do candidato:', theoreticalTests);
      
      setTheoreticalTestResults(theoreticalTests);
    } catch (error) {
      console.error('🚨 Erro ao carregar provas teóricas:', error);
      setTheoreticalTestResults([]);
    } finally {
      setIsLoadingTheoreticalResults(false);
    }
  }, [candidate]);

  // Carregar resultados quando o modal abre
  useEffect(() => {
    if (candidate) {
      loadTheoreticalTestResults();
      // Carregar valores existentes das anotações
      setInterviewNotes(getSafeValue(candidate.notas_entrevista) || '');
      setRejectionReason(getSafeValue(candidate.motivo_reprova) || '');
    }
  }, [candidate, loadTheoreticalTestResults]);

  // Função utilitária para tratar questões de forma segura
  const getQuestionsArray = (questoes: unknown): unknown[] => {
    if (!questoes) return [];
    if (Array.isArray(questoes)) return questoes;
    if (typeof questoes === 'string') {
      try {
        return JSON.parse(questoes);
      } catch {
        return [];
      }
    }
    return [];
  };

  if (!candidate) return null;

  // Sanitizar dados do candidato para evitar renderização de objetos
  const sanitizedCandidate = {
    ...candidate,
    nome: getSafeValue(candidate.nome),
    email: getSafeValue(candidate.email),
    telefone: getSafeValue(candidate.telefone),
    sexo: getSafeValue(candidate.sexo),
    escolaridade: getSafeValue(candidate.escolaridade),
    resumo_ia: getSafeValue(candidate.resumo_ia),
    resumo_perfil: getSafeValue(candidate.resumo_perfil),
    behavioral_test_status: getSafeValue(candidate.behavioral_test_status),
    theoretical_test_status: getSafeValue(candidate.theoretical_test_status),
  };

  const handleFileUpload = async (file: File, type: 'video' | 'test') => {
    if (!candidate) return;
    setIsUploading(type);
    setUploadError(null);

    const endpoint = type === 'video' 
      ? `/api/candidates/${candidate.id}/video-interview`
      : `/api/candidates/${candidate.id}/theoretical-test`;

    const formData = new FormData();
    formData.append(type === 'video' ? 'video' : 'testResult', file);

    try {
      const response = await fetch(endpoint, { method: 'POST', body: formData });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Falha no upload do ${type}.`);
      }
      showSuccess(`Upload de ${type === 'video' ? 'vídeo' : 'teste'} realizado com sucesso!`);
      onDataSynced(); 
    } catch (error: unknown) {
      console.error(`Erro no upload do ${type}:`, error);
      setUploadError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsUploading(null);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'video');
  };

  const handleStatusChange = (newStatus: CandidateStatus) => {
    if (newStatus === 'Reprovado') {
      setShowRejectionModal(true);
    } else {
      onUpdateStatus(candidate.id, newStatus);
    }
    setShowStatusMenu(false);
  };

  const handleRejectionConfirm = async (reason: string) => {
    setIsUpdatingStatus(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Reprovado',
          motivo_reprova: reason,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setRejectionReason(reason);
        onUpdateStatus(candidate.id, 'Reprovado');
        onDataSynced();
        setShowRejectionModal(false);
      } else {
        throw new Error(data.error || 'Erro ao atualizar status.');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showError('Não foi possível atualizar o status. Tente novamente.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRejectionCancel = () => {
    setShowRejectionModal(false);
  };

  // DEBUG - Logs temporários
  console.log('CandidateDetailModal - video_entrevista:', candidate.video_entrevista);
  console.log('CandidateDetailModal - Tipo:', typeof candidate.video_entrevista);
  console.log('CandidateDetailModal - É array?', Array.isArray(candidate.video_entrevista));
  
  const handleGenerateTestLink = async () => {
    if (!profile || !candidate) return;
    setIsGeneratingLink(true);
    try {
        const response = await fetch(`/api/behavioral-test/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateId: candidate.id, recruiterId: profile.id }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Falha ao gerar o link.');
        
        const link = `${window.location.origin}/teste/${data.testId}`;
        setGeneratedLink(link);
    } catch (error: unknown) {
        console.error("Erro ao gerar link do teste:", error);
        showError("Não foi possível gerar o link do teste. Tente novamente.");
    } finally {
        setIsGeneratingLink(false);
    }
  };

  // Carregar modelos de prova teórica disponíveis
  const loadTheoreticalModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/theoretical-models`, {
        headers: {
          'x-user-id': profile?.id?.toString() || '1'
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao carregar modelos');
      
      // Filtrar apenas modelos ativos
      const activeModels = data.data?.filter((model: TheoreticalModel) => model.ativo) || [];
      setTheoreticalModels(activeModels);
      
      if (activeModels.length === 0) {
        alert('Não há modelos de prova ativo. Por favor, ative um modelo na página de Provas Teóricas.');
        return;
      }
      
      setShowModelSelection(true);
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
      showError('Erro ao carregar modelos de prova. Tente novamente.');
    } finally {
      setIsLoadingModels(false);
    }
  };



  const handleGenerateTheoreticalTestLink = async (modelId: string) => {
    if (!profile || !candidate) return;
    setIsGeneratingTheoreticalLink(true);
    setShowModelSelection(false);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/theoretical-test/generate`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-user-id': profile?.id?.toString() || '1'
            },
            body: JSON.stringify({ 
              candidato_id: candidate.id.toString(), 
              modelo_prova_id: modelId,
              recruiterId: profile?.id
            }),
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Falha ao gerar o link do teste teórico.');
        }
        
        const link = `${window.location.origin}/prova-teorica/${data.data.id}`;
        setGeneratedTheoreticalLink(link);
        
        // 🔧 CORREÇÃO: Adicionar nova prova à lista local
        const newTest = {
          id: data.data.id,
          modelo_nome: data.data.modelo_nome || 'Nova Prova',
          pontuacao_total: 0,
          status: 'Pendente',
          data_finalizacao: undefined
        };
        
        setTheoreticalTestResults(currentResults => [...currentResults, newTest]);
        
        showSuccess('Link da prova teórica gerado com sucesso!');
    } catch (error: unknown) {
        console.error("Erro ao gerar link do teste teórico:", error);
        showError("Não foi possível gerar o link do teste teórico. Tente novamente.");
    } finally {
        setIsGeneratingTheoreticalLink(false);
    }
  };

  const handleDeleteTest = async (testId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta prova permanentemente? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/theoretical-test/delete/${testId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        showSuccess('Prova excluída com sucesso!');
        
        // 🔧 CORREÇÃO: Atualizar estado local removendo a prova excluída
        setTheoreticalTestResults(currentResults => 
          currentResults.filter(test => test.id !== testId)
        );
        
        // Opcional: Também recarregar para garantir sincronização
        // loadTheoreticalTestResults();
      } else {
        throw new Error(data.error || 'Erro ao excluir prova.');
      }
    } catch (error) {
      console.error('Erro ao excluir prova:', error);
      showError('Não foi possível excluir a prova. Tente novamente.');
    }
  };

  const handleViewGabarito = async (testId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/theoretical-test/review/${testId}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Abrir modal ou página com gabarito
        window.open(`${window.location.origin}/gabarito-teorica/${testId}`, '_blank');
      } else {
        throw new Error(data.error || 'Erro ao buscar gabarito.');
      }
    } catch (error) {
      console.error('Erro ao buscar gabarito:', error);
      showError('Não foi possível acessar o gabarito. Tente novamente.');
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleCopyTheoreticalLink = () => {
    if (!generatedTheoreticalLink) return;
    navigator.clipboard.writeText(generatedTheoreticalLink).then(() => {
        setCopyTheoreticalSuccess(true);
        setTimeout(() => setCopyTheoreticalSuccess(false), 2000);
    });
  };

  const handleClose = () => {
    setGeneratedLink(null);
    setGeneratedTheoreticalLink(null);
    onClose();
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const chartData = {
    executor: Number(candidate.perfil_executor || 0),
    comunicador: Number(candidate.perfil_comunicador || 0),
    planejador: Number(candidate.perfil_planejador || 0),
    analista: Number(candidate.perfil_analista || 0),
  };
  // Verificar se o currículo é um array ou string diretamente
  const curriculumAvailable = Array.isArray(candidate.curriculo) 
    ? candidate.curriculo[0]?.url 
    : candidate.curriculo;

  // Preparar número do WhatsApp e URL com mensagem personalizada
  const whatsappNumber = formatPhoneNumberForWhatsApp(candidate.telefone || null);
  const nomeEmpresa = profile?.empresa || 'nossa empresa';
  const whatsappUrl = whatsappNumber ? generateWhatsAppUrl(whatsappNumber, candidate, nomeEmpresa) : undefined;

  // Verificar se deve mostrar a seção de entrevista por vídeo
  const shouldShowVideoSection = () => {
    const videoStatusList = ['Entrevista por Vídeo', 'Teste Teórico', 'Entrevista Presencial', 'Teste Prático', 'Contratado', 'Reprovado'];
    return videoStatusList.includes(getSafeValue(candidate.status?.value) || getSafeValue(candidate.status) || '');
  };

  // Função para salvar anotações da entrevista
  const saveInterviewNotes = async () => {
    if (!candidate) return;
    setIsSavingNotes(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notas_entrevista: interviewNotes,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setIsEditingNotes(false);
        onDataSynced(); // Atualizar dados na listagem
        showSuccess('Anotações salvas com sucesso!');
      } else {
        throw new Error(data.error || 'Erro ao salvar anotações.');
      }
    } catch (error) {
      console.error('Erro ao salvar anotações:', error);
      showError('Não foi possível salvar as anotações. Tente novamente.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-800">Detalhes do Candidato</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex items-center space-x-4">
              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full flex-shrink-0"><User size={32} /></div>
              <div>
                  <h3 className="text-2xl font-bold text-gray-900 break-words">{getSafeValue(candidate.nome)}</h3>
                  {candidate.email && <p className="text-md text-gray-500 flex items-center mt-1 break-all"><Mail size={16} className="mr-2 flex-shrink-0"/> {getSafeValue(candidate.email)}</p>}
                  {candidate.telefone && <p className="text-md text-gray-500 flex items-center mt-1"><MessageCircle size={16} className="mr-2 flex-shrink-0"/> {getSafeValue(candidate.telefone)}</p>}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg"><div className="flex items-center text-gray-500 mb-1"><Star size={16} className="mr-2" /><span className="text-sm font-semibold">Score</span></div><p className={`text-3xl font-bold ${getScoreColor(candidate.score)}`}>{candidate.score ?? 'N/A'}%</p></div>
              <div className="bg-gray-50 p-4 rounded-lg"><div className="flex items-center text-gray-500 mb-1"><Briefcase size={16} className="mr-2" /><span className="text-sm font-semibold">Vaga Aplicada</span></div><p className="text-lg font-semibold text-gray-800">{candidate.vaga && candidate.vaga[0] ? getSafeValue(candidate.vaga[0].value) || getSafeValue(candidate.vaga[0]) || 'Não informada' : 'Não informada'}</p></div>
          </div>
          
          <div><div className="flex items-center text-gray-600 mb-2"><FileText size={18} className="mr-2" /><h4 className="text-lg font-bold">Resumo da IA</h4></div><p className="text-gray-700 bg-gray-50 p-4 rounded-lg border leading-relaxed">{typeof candidate.resumo_ia === 'string' ? candidate.resumo_ia : "Nenhum resumo disponível."}</p></div>
          
          {/* Seção de Anotações da Entrevista */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-blue-700">
                <FileText size={20} className="mr-2" />
                <h4 className="text-lg font-bold">Anotações da Entrevista</h4>
              </div>
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Edit size={16} />
                  Editar
                </button>
              )}
            </div>
            
            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Digite suas anotações sobre o candidato..."
                  className="w-full h-32 p-3 border border-blue-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveInterviewNotes}
                    disabled={isSavingNotes}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                  >
                    {isSavingNotes ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Salvar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingNotes(false);
                      setInterviewNotes(getSafeValue(candidate.notas_entrevista) || '');
                    }}
                    disabled={isSavingNotes}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-400 transition-colors"
                  >
                    <X size={16} />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                {interviewNotes ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{interviewNotes}</p>
                ) : (
                  <p className="text-gray-500 italic">Nenhuma anotação disponível. Clique em "Editar" para adicionar.</p>
                )}
              </div>
            )}
          </div>

          {/* Mostrar motivo de reprovação se o candidato foi reprovado */}
          {(getSafeValue(candidate.status?.value) || getSafeValue(candidate.status)) === 'Reprovado' && rejectionReason && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center text-red-700 mb-3">
                <AlertCircle size={20} className="mr-2" />
                <h4 className="text-lg font-bold">Motivo da Reprovação</h4>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="text-gray-700">{rejectionReason}</p>
              </div>
            </div>
          )}
          
          {/* Seção de Entrevista por Vídeo */}
          {shouldShowVideoSection() && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
              <div className="flex items-center text-indigo-700 mb-4">
                <Video size={20} className="mr-2" />
                <h4 className="text-lg font-bold">
                  {(getSafeValue(candidate.status?.value) || getSafeValue(candidate.status)) === 'Entrevista por Vídeo' 
                    ? 'Entrevista por Vídeo' 
                    : 'Vídeo da Entrevista'
                  }
                </h4>
              </div>
              
              {candidate.video_entrevista && candidate.video_entrevista.length > 0 ? (
                <div className="space-y-4">
                  {/* Player de vídeo */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h5 className="text-md font-semibold text-gray-800 mb-3">Entrevista em Vídeo</h5>
                    <video 
                      controls 
                      className="w-full rounded-lg shadow-sm"
                      style={{ maxHeight: '400px' }}
                    >
                      <source src={candidate.video_entrevista[0].url} type="video/mp4" />
                      <source src={candidate.video_entrevista[0].url} type="video/webm" />
                      <source src={candidate.video_entrevista[0].url} type="video/mov" />
                      Seu navegador não suporta o elemento de vídeo.
                    </video>
                  </div>
                  
                  {/* Opção de substituir vídeo */}
                  <div className="text-center bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">Deseja substituir o vídeo atual?</p>
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      disabled={isUploading === 'video'}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors mx-auto"
                    >
                      {isUploading === 'video' ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <UploadCloud size={16} />
                          Substituir Vídeo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-white rounded-lg p-6 border-2 border-dashed border-indigo-300">
                    <div className="text-center">
                      <Video size={48} className="mx-auto text-indigo-400 mb-4" />
                      <p className="text-lg font-semibold text-indigo-800 mb-2">
                        {(getSafeValue(candidate.status?.value) || getSafeValue(candidate.status)) === 'Entrevista por Vídeo' 
                          ? 'Aguardando Vídeo da Entrevista'
                          : 'Vídeo não Enviado'
                        }
                      </p>
                      <p className="text-sm text-indigo-600 mb-4">
                        {(getSafeValue(candidate.status?.value) || getSafeValue(candidate.status)) === 'Entrevista por Vídeo' 
                          ? 'O candidato precisa enviar o vídeo da entrevista para prosseguir no processo seletivo.'
                          : 'O candidato avançou no processo sem enviar o vídeo da entrevista. Você pode fazer o upload manualmente se necessário.'
                        }
                      </p>
                      
                      <button
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isUploading === 'video'}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors mx-auto"
                      >
                        {isUploading === 'video' ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            Enviando vídeo...
                          </>
                        ) : (
                          <>
                            <UploadCloud size={20} />
                            {(getSafeValue(candidate.status?.value) || getSafeValue(candidate.status)) === 'Entrevista por Vídeo' 
                              ? 'Fazer Upload do Vídeo'
                              : 'Upload de Vídeo (Manual)'
                            }
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Formatos aceitos: MP4, WebM, MOV</p>
                    <p>• Tamanho máximo: 100MB</p>
                    <p>• Duração recomendada: 2-5 minutos</p>
                  </div>
                </div>
              )}
              
              {uploadError && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                  <AlertCircle size={16} />
                  <span className="text-sm">{uploadError}</span>
                </div>
              )}
              
              {/* Input de arquivo oculto */}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/mov,video/quicktime"
                onChange={handleVideoFileChange}
                className="hidden"
              />
            </div>
          )}
          
          <div>
              <div className="flex items-center text-gray-600 mb-4"><BrainCircuit size={18} className="mr-2 text-purple-600" /><h4 className="text-lg font-bold">Perfil Comportamental</h4></div>
              {candidate.behavioral_test_status === 'Concluído' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border"><p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{typeof candidate.resumo_perfil === 'string' ? candidate.resumo_perfil : 'Resumo não disponível'}</p></div>
                  <div className="md:col-span-1"><ProfileChart data={chartData} /></div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border text-center"><p className="text-gray-600">{typeof candidate.behavioral_test_status === 'string' && candidate.behavioral_test_status ? `Status: ${candidate.behavioral_test_status}` : 'Teste não concluído.'}</p></div>
              )}
          </div>

          {/* Seção de Prova Teórica */}
          <div>
            <div className="flex items-center text-gray-600 mb-4">
              <BookOpen size={18} className="mr-2 text-green-600" />
              <h4 className="text-lg font-bold">Provas Teóricas</h4>
            </div>
            
            {isLoadingTheoreticalResults ? (
              <div className="bg-gray-50 p-4 rounded-lg border text-center">
                <Loader2 size={20} className="animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Carregando resultados...</p>
              </div>
            ) : theoreticalTestResults.length > 0 ? (
              <div className="space-y-3">
                {theoreticalTestResults.map((result) => (
                  <div key={result.id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-gray-800">{result.modelo_nome || 'Modelo não identificado'}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isTestCompleted(result.status)
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {formatTestStatus(result.status)}
                      </span>
                    </div>
                    
                    {isTestCompleted(result.status) && result.pontuacao_total !== undefined && (
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Pontuação</p>
                          <p className="text-lg font-bold text-green-600">{result.pontuacao_total}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Status</p>
                          <p className="text-lg font-bold text-blue-600">Finalizada</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Ações</p>
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleViewGabarito(result.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Ver gabarito"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTest(result.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Excluir prova"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!isTestCompleted(result.status) && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleDeleteTest(result.id)}
                          className="flex items-center gap-1 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200"
                        >
                          <Trash2 size={12} />
                          Excluir
                        </button>
                      </div>
                    )}
                    
                    {result.data_finalizacao && (
                      <p className="text-xs text-gray-500 mt-2">
                        Finalizada em: {new Date(result.data_finalizacao).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border text-center">
                <p className="text-gray-600">Nenhuma prova teórica realizada ainda.</p>
              </div>
            )}
          </div>
            

        </div>

        {/* Barra inferior melhorada para desktop e mobile */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          {/* Layout para mobile (stack vertical) */}
          <div className="flex flex-col gap-3 sm:hidden">
            <div className="grid grid-cols-2 gap-3">
              {curriculumAvailable ? (
                <a 
                  href={curriculumAvailable} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Download size={16}/> Currículo
                </a>
              ) : (
                <button 
                  disabled 
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  title="Currículo não disponível"
                >
                  <Download size={16}/> Currículo
                </button>
              )}
              <button onClick={() => onScheduleInterview(candidate)} className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700">
                <CalendarPlus size={16} /> Agendar
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => !whatsappNumber && e.preventDefault()}
                className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                  whatsappNumber 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title={whatsappNumber ? 'Enviar mensagem personalizada no WhatsApp' : 'Telefone não disponível'}
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={handleGenerateTestLink} disabled={isGeneratingLink} className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50">
                <ClipboardList size={16} />{isGeneratingLink ? "Gerando..." : "Teste Comportamental"}
              </button>
              <button onClick={loadTheoreticalModels} disabled={isGeneratingTheoreticalLink || isLoadingModels} className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                <BookOpen size={16} />
                {isLoadingModels ? "Carregando..." : isGeneratingTheoreticalLink ? "Gerando..." : "Teste Teórico"}
              </button>
            </div>
          </div>

          {/* Layout para desktop (horizontal com melhor espaçamento) */}
          <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
            {/* Grupo de ações principais - esquerda */}
            <div className="flex flex-wrap items-center gap-3">
              {curriculumAvailable ? (
                <a 
                  href={curriculumAvailable} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 whitespace-nowrap"
                >
                  <Download size={16}/> Currículo
                </a>
              ) : (
                <button 
                  disabled 
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 whitespace-nowrap"
                  title="Currículo não disponível"
                >
                  <Download size={16}/> Currículo
                </button>
              )}
              <button onClick={() => onScheduleInterview(candidate)} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md whitespace-nowrap">
                <CalendarPlus size={16} /> Agendar
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => !whatsappNumber && e.preventDefault()}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                  whatsappNumber 
                    ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
                title={whatsappNumber ? 'Enviar mensagem personalizada no WhatsApp' : 'Telefone não disponível'}
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>

            {/* Grupo de testes - centro */}
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={handleGenerateTestLink} disabled={isGeneratingLink} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md disabled:opacity-50 whitespace-nowrap">
                <ClipboardList size={16} />{isGeneratingLink ? "Gerando..." : "Teste Comportamental"}
              </button>
              <button onClick={loadTheoreticalModels} disabled={isGeneratingTheoreticalLink || isLoadingModels} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors bg-green-600 text-white hover:bg-green-700 hover:shadow-md disabled:opacity-50 whitespace-nowrap">
                <BookOpen size={16} />
                {isLoadingModels ? "Carregando..." : isGeneratingTheoreticalLink ? "Gerando..." : "Teste Teórico"}
              </button>
            </div>

            {/* Seção de Links Gerados - Fixa na barra inferior */}
            {(generatedLink || generatedTheoreticalLink) && (
              <div className="flex flex-col gap-2 w-full max-w-md">
                {generatedLink && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-indigo-800">🔗 Teste Comportamental</span>
                      <button onClick={handleCopyLink} className={`px-2 py-1 text-xs rounded transition-colors ${copySuccess ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}>
                        {copySuccess ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <input type="text" readOnly value={generatedLink} className="w-full text-xs text-gray-600 bg-transparent border-0 p-0 mt-1 focus:outline-none" />
                  </div>
                )}
                {generatedTheoreticalLink && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-green-800">🔗 Teste Teórico</span>
                      <button onClick={handleCopyTheoreticalLink} className={`px-2 py-1 text-xs rounded transition-colors ${copyTheoreticalSuccess ? 'bg-green-100 text-green-700' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                        {copyTheoreticalSuccess ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <input type="text" readOnly value={generatedTheoreticalLink} className="w-full text-xs text-gray-600 bg-transparent border-0 p-0 mt-1 focus:outline-none" />
                  </div>
                )}
              </div>
            )}

            {/* Grupo de status - direita */}
            <div className="relative">
              <button onClick={() => setShowStatusMenu(!showStatusMenu)} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 hover:shadow-sm whitespace-nowrap">
                <RefreshCcw size={16} /> Status: {getSafeValue(candidate.status?.value) || getSafeValue(candidate.status) || 'Triagem'} <ChevronDown size={16} className="ml-1" />
              </button>
              {showStatusMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-30">
                  {['Triagem', 'Entrevista por Vídeo', 'Teste Teórico', 'Entrevista Presencial', 'Teste Prático', 'Contratado', 'Reprovado'].map((status) => (
                    <button key={status} onClick={() => handleStatusChange(status as CandidateStatus)} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md transition-colors">
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botão de status para mobile (separado) */}
          <div className="mt-3 sm:hidden">
            <div className="relative">
              <button onClick={() => setShowStatusMenu(!showStatusMenu)} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300">
                <RefreshCcw size={16} /> Status: {getSafeValue(candidate.status?.value) || getSafeValue(candidate.status) || 'Triagem'} <ChevronDown size={16} className="ml-1" />
              </button>
              {showStatusMenu && (
                <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-md shadow-lg border border-gray-200 z-30">
                  {['Triagem', 'Entrevista por Vídeo', 'Teste Teórico', 'Entrevista Presencial', 'Teste Prático', 'Contratado', 'Reprovado'].map((status) => (
                    <button key={status} onClick={() => handleStatusChange(status as CandidateStatus)} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md transition-colors">
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Modelo de Prova Teórica */}
      {showModelSelection && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex justify-center items-center z-10 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <BookOpen size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Selecionar Modelo de Prova</h3>
                    <p className="text-green-100 text-sm">Escolha o modelo para {candidate.nome}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModelSelection(false)} 
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto max-h-96">
              {isLoadingModels ? (
                <div className="text-center py-8">
                  <Loader2 size={32} className="animate-spin mx-auto text-green-600 mb-3" />
                  <p className="text-gray-600">Carregando modelos disponíveis...</p>
                </div>
              ) : theoreticalModels.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <AlertCircle size={32} className="text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Nenhum modelo disponível</h4>
                  <p className="text-gray-500">Não há modelos de prova teórica ativos no momento.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 text-center mb-6">
                    Selecione o modelo de prova teórica mais adequado para este candidato:
                  </p>
                  
                  {theoreticalModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleGenerateTheoreticalTestLink(model.id.toString())}
                      disabled={isGeneratingTheoreticalLink}
                      className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-green-100 text-green-600 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
                              <BookOpen size={16} />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-800 group-hover:text-green-700">
                              {model.nome}
                            </h4>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {model.descricao || 'Sem descrição disponível'}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>{model.tempo_limite} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText size={12} />
                              <span>{getQuestionsArray(model.questoes).length} questões</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <ChevronRight size={20} className="text-gray-400 group-hover:text-green-600 transition-colors" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer do Modal */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowModelSelection(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Motivo de Reprovação */}
      <RejectionReasonModal
        isOpen={showRejectionModal}
        candidateName={getSafeValue(candidate.nome)}
        onConfirm={handleRejectionConfirm}
        onCancel={handleRejectionCancel}
        isLoading={isUpdatingStatus}
      />

      {/* Container de Toasts */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
};

export default CandidateDetailModal;