// Caminho: src/features/results/components/CandidateDetailModal.tsx
// SUBSTITUA O CONTEÚDO INTEIRO DESTE ARQUIVO

import React, { useState } from 'react';
import { X, User, Star, Briefcase, FileText, MessageCircle, Download, CalendarPlus, ChevronDown, RefreshCcw, ClipboardList, Mail, Copy, Check, BrainCircuit } from 'lucide-react';
import { Candidate } from '../../../shared/types';
import { useAuth } from '../../auth/hooks/useAuth';
import { formatPhoneNumberForWhatsApp } from '../../../shared/utils/formatters';
import ProfileChart from '../../behavioral/components/ProfileChart';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onUpdateStatus: (candidateId: number, newStatus: 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado') => void;
}

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ candidate, onClose, onScheduleInterview, onUpdateStatus }) => {
  const { profile } = useAuth();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!candidate) return null;

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

  const whatsappNumber = formatPhoneNumberForWhatsApp(candidate.telefone);
  const curriculumAvailable = candidate.curriculo && candidate.curriculo[0];

  const handleStatusChange = (newStatus: 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado') => {
    onUpdateStatus(candidate.id, newStatus);
    setShowStatusMenu(false);
  };
  
  const chartData = {
    executor: Number(candidate.perfil_executor || 0),
    comunicador: Number(candidate.perfil_comunicador || 0),
    planejador: Number(candidate.perfil_planejador || 0),
    analista: Number(candidate.perfil_analista || 0),
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-scale-in">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-800">Detalhes do Candidato</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 transition-colors"><X size={24} /></button>
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

            <div>
              <div className="flex items-center text-gray-600 mb-4">
                <BrainCircuit size={18} className="mr-2 text-purple-600" />
                <h4 className="text-lg font-bold">Perfil Comportamental</h4>
              </div>
              {candidate.behavioral_test_status === 'Concluído' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{candidate.resumo_perfil}</p>
                  </div>
                  <div className="md:col-span-1">
                    <ProfileChart data={chartData} />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border text-center">
                  <p className="text-gray-600">
                    {candidate.behavioral_test_status ? `Status: ${candidate.behavioral_test_status}` : 'Teste comportamental ainda não foi concluído.'}
                  </p>
                </div>
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
            <a href={curriculumAvailable ? curriculumAvailable.url : undefined} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${curriculumAvailable ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}><Download size={16}/>Currículo</a>
            <button onClick={handleGenerateTestLink} disabled={isGeneratingLink} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-purple-600 text-white hover:bg-purple-700 w-full sm:w-auto disabled:opacity-50"><ClipboardList size={16} />{isGeneratingLink ? "Gerando..." : "Teste Comportamental"}</button>
            <button onClick={() => onScheduleInterview(candidate)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto"><CalendarPlus size={16} />Agendar</button>
            <div className="relative w-full sm:w-auto">
                <button onClick={() => setShowStatusMenu(!showStatusMenu)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 w-full"><RefreshCcw size={16} />Status: {candidate.status?.value || 'Triagem'} <ChevronDown size={16} className="ml-1" /></button>
                {showStatusMenu && <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg z-10">{['Triagem', 'Entrevista', 'Aprovado', 'Reprovado'].map((statusOption) => <button key={statusOption} onClick={() => handleStatusChange(statusOption as any)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{statusOption}</button>)}</div>}
            </div>
        </div>
      </div>
      <style>{`.animate-scale-in { animation: scale-in 0.2s ease-out forwards; } @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
};

export default CandidateDetailModal;