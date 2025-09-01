// Caminho: src/features/results/components/CandidateDetailModal.tsx
// SUBSTITUA O CONTEÚDO INTEIRO DESTE ARQUIVO

import React, { useState, useRef } from 'react';
// --- CORREÇÃO APLICADA AQUI: Adicionado 'MessageCircle' à importação ---
import { X, User, Star, Briefcase, FileText, Download, CalendarPlus, ChevronDown, RefreshCcw, Mail, Copy, Check, BrainCircuit, UploadCloud, Video, FileInput, Loader2, ClipboardList, MessageCircle } from 'lucide-react';
import { Candidate, CandidateStatus } from '../../../shared/types';
import { useAuth } from '../../auth/hooks/useAuth';
import ProfileChart from '../../behavioral/components/ProfileChart';
import { formatPhoneNumberForWhatsApp } from '../../../shared/utils/formatters';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onUpdateStatus: (candidateId: number, newStatus: CandidateStatus) => void;
  onDataSynced: () => void; // Para forçar a atualização dos dados
}

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ candidate, onClose, onScheduleInterview, onUpdateStatus, onDataSynced }) => {
  const { profile } = useAuth();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isUploading, setIsUploading] = useState< 'video' | 'test' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const testInputRef = useRef<HTMLInputElement>(null);

  if (!candidate) return null;

  const handleFileUpload = async (file: File, type: 'video' | 'test') => {
    if (!candidate) return;
    setIsUploading(type);
    setUploadError(null);

    const endpoint = type === 'video' 
      ? `${API_BASE_URL}/api/candidates/${candidate.id}/video-interview`
      : `${API_BASE_URL}/api/candidates/${candidate.id}/theoretical-test`;

    const formData = new FormData();
    formData.append(type === 'video' ? 'video' : 'testResult', file);

    try {
      const response = await fetch(endpoint, { method: 'POST', body: formData });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Falha no upload do ${type}.`);
      }
      alert(`Upload de ${type === 'video' ? 'vídeo' : 'teste'} realizado com sucesso!`);
      onDataSynced(); 
    } catch (error: any) {
      console.error(`Erro no upload do ${type}:`, error);
      setUploadError(error.message);
    } finally {
      setIsUploading(null);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'video');
  };
  const handleTestFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'test');
  };

  const handleStatusChange = (newStatus: CandidateStatus) => {
    onUpdateStatus(candidate.id, newStatus);
    setShowStatusMenu(false);
  };
  
  const handleGenerateTestLink = async () => {
    if (!profile || !candidate) return;
    setIsGeneratingLink(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/behavioral-test/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateId: candidate.id, recruiterId: profile.id }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Falha ao gerar o link.');
        
        const link = `${window.location.origin}/teste/${data.testId}`;
        setGeneratedLink(link);
    } catch (error) {
        console.error("Erro ao gerar link do teste:", error);
        alert("Não foi possível gerar o link do teste. Tente novamente.");
    } finally {
        setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleClose = () => {
    setGeneratedLink(null);
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
  const curriculumAvailable = candidate.curriculo && candidate.curriculo[0];

  const getScheduleButtonText = () => {
    const status = candidate.status?.value;
    if (status === 'Teste Teórico' || status === 'Entrevista por Vídeo') {
        return 'Agendar Teste Prático';
    }
    return 'Agendar Entrevista';
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
              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full"><User size={32} /></div>
              <div>
                  <h3 className="text-2xl font-bold text-gray-900">{candidate.nome}</h3>
                  {candidate.email && <p className="text-md text-gray-500 flex items-center mt-1"><Mail size={16} className="mr-2"/> {candidate.email}</p>}
                  {candidate.telefone && <p className="text-md text-gray-500 flex items-center mt-1"><MessageCircle size={16} className="mr-2"/> {candidate.telefone}</p>}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg"><div className="flex items-center text-gray-500 mb-1"><Star size={16} className="mr-2" /><span className="text-sm font-semibold">Score de Aderência</span></div><p className={`text-3xl font-bold ${getScoreColor(candidate.score)}`}>{candidate.score ?? 'N/A'}%</p></div>
              <div className="bg-gray-50 p-4 rounded-lg"><div className="flex items-center text-gray-500 mb-1"><Briefcase size={16} className="mr-2" /><span className="text-sm font-semibold">Vaga Aplicada</span></div><p className="text-lg font-semibold text-gray-800">{candidate.vaga && candidate.vaga[0] ? candidate.vaga[0].value : 'Não informada'}</p></div>
          </div>
          
          <div><div className="flex items-center text-gray-600 mb-2"><FileText size={18} className="mr-2" /><h4 className="text-lg font-bold">Resumo da Inteligência Artificial</h4></div><p className="text-gray-700 bg-gray-50 p-4 rounded-lg border leading-relaxed">{candidate.resumo_ia || "Nenhum resumo disponível."}</p></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-gray-600 mb-2"><Video size={18} className="mr-2" /><h4 className="text-md font-bold">Entrevista por Vídeo</h4></div>
              {candidate.video_entrevista && candidate.video_entrevista[0] ? (
                <a href={candidate.video_entrevista[0].url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100">
                  <Download size={16} /> Ver Vídeo Enviado
                </a>
              ) : (
                <button onClick={() => videoInputRef.current?.click()} disabled={!!isUploading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 w-full justify-center">
                  {isUploading === 'video' ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  {isUploading === 'video' ? 'A enviar...' : 'Fazer Upload do Vídeo'}
                </button>
              )}
              <input type="file" ref={videoInputRef} onChange={handleVideoFileChange} className="hidden" accept="video/*" />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-gray-600 mb-2"><FileInput size={18} className="mr-2" /><h4 className="text-md font-bold">Teste Teórico</h4></div>
              {candidate.resultado_teste_teorico && candidate.resultado_teste_teorico[0] ? (
                <a href={candidate.resultado_teste_teorico[0].url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100">
                  <Download size={16} /> Ver Resultado
                </a>
              ) : (
                <button onClick={() => testInputRef.current?.click()} disabled={!!isUploading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 w-full justify-center">
                  {isUploading === 'test' ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  {isUploading === 'test' ? 'A enviar...' : 'Fazer Upload do Teste'}
                </button>
              )}
              <input type="file" ref={testInputRef} onChange={handleTestFileChange} className="hidden" accept=".pdf,.doc,.docx,image/*" />
            </div>
          </div>
          {uploadError && <p className="text-sm text-red-600 text-center">{uploadError}</p>}
          
          <div>
              <div className="flex items-center text-gray-600 mb-4"><BrainCircuit size={18} className="mr-2 text-purple-600" /><h4 className="text-lg font-bold">Perfil Comportamental</h4></div>
              {candidate.behavioral_test_status === 'Concluído' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border"><p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{candidate.resumo_perfil}</p></div>
                  <div className="md:col-span-1"><ProfileChart data={chartData} /></div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border text-center"><p className="text-gray-600">{candidate.behavioral_test_status ? `Status: ${candidate.behavioral_test_status}` : 'Teste comportamental ainda não foi concluído.'}</p></div>
              )}
          </div>
            
          {generatedLink && (
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-lg">
                  <h4 className="text-lg font-bold text-indigo-800">Link do Teste Gerado!</h4>
                  <p className="text-indigo-700 mt-2">Envie o link abaixo para o candidato. O resultado aparecerá aqui assim que ele responder.</p>
                  <div className="mt-4 flex items-center bg-white border border-gray-300 rounded-md p-2">
                      <input type="text" readOnly value={generatedLink} className="w-full text-sm text-gray-700 bg-transparent focus:outline-none" />
                      <button onClick={handleCopyLink} className={`p-2 rounded-md transition-colors ${copySuccess ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                  </div>
              </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-lg flex flex-wrap justify-end items-center gap-3">
            <a href={curriculumAvailable?.url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${curriculumAvailable ? 'bg-white border text-gray-700 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}><Download size={16}/>Currículo</a>
            <button onClick={handleGenerateTestLink} disabled={isGeneratingLink} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"><ClipboardList size={16} />{isGeneratingLink ? "Gerando..." : "Teste Comportamental"}</button>
            <button onClick={() => onScheduleInterview(candidate)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700">
              <CalendarPlus size={16} /> {getScheduleButtonText()}
            </button>
            <div className="relative">
              <button onClick={() => setShowStatusMenu(!showStatusMenu)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 w-full">
                <RefreshCcw size={16} /> Status: {candidate.status?.value || 'Triagem'} <ChevronDown size={16} className="ml-1" />
              </button>
              {showStatusMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg z-20">
                  {['Triagem', 'Entrevista por Vídeo', 'Teste Teórico', 'Teste Prático', 'Contratado', 'Reprovado'].map((status) => (
                    <button key={status} onClick={() => handleStatusChange(status as CandidateStatus)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailModal;