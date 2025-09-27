// Local: src/features/agenda/components/GoogleEventDetailModal.tsx

import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Calendar, Phone, Mail, Award, TrendingUp, Clock, Star, ExternalLink, BrainCircuit } from 'lucide-react';
import { GoogleCalendarEvent } from '../../../shared/services/googleCalendarService';
import { Candidate } from '../../../shared/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDataStore } from '../../../shared/store/useDataStore';

interface GoogleEventDetailModalProps {
  event: GoogleCalendarEvent | null;
  onClose: () => void;
}

const GoogleEventDetailModal: React.FC<GoogleEventDetailModalProps> = ({ event, onClose }) => {
  const { candidates } = useDataStore();
  const [candidateDetails, setCandidateDetails] = useState<Candidate | null>(null);

  // Função para extrair valor seguro de campos que podem vir como objetos
  const getSafeValue = (field: unknown): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && field !== null && 'value' in field) {
      return String((field as { value?: unknown }).value || '');
    }
    return String(field);
  };

  useEffect(() => {
    if (event && candidates) {
      // Tentar extrair dados do candidato de diferentes formas
      const metadata = getEventMetadata(event);
      let foundCandidate = null;
      
      if (metadata?.candidato) {
        // Procurar por ID se disponível
        foundCandidate = candidates.find(c => c.id === metadata.candidato.id);
      }
      
      if (!foundCandidate && event.title) {
        // Procurar pelo nome no título "Entrevista - Nome Candidato"
        const candidateName = event.title.replace('Entrevista - ', '').trim();
        foundCandidate = candidates.find(c => 
          c.nome?.toLowerCase().includes(candidateName.toLowerCase()) ||
          candidateName.toLowerCase().includes(c.nome?.toLowerCase() || '')
        );
      }
      
      setCandidateDetails(foundCandidate || null);
    }
  }, [event, candidates]);

  if (!event) return null;

  const getEventMetadata = (event: GoogleCalendarEvent) => {
    try {
      if (event.description && event.description.startsWith('{')) {
        return JSON.parse(event.description);
      }
    } catch {
      // Ignorar se não for JSON válido
    }
    return null;
  };

  const metadata = getEventMetadata(event);
  const isInterviewEvent = metadata?.type === 'interview' || event.title?.includes('Entrevista');

  const formatDate = (date: Date) => {
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aprovado': return 'text-green-700 bg-green-100';
      case 'rejeitado': return 'text-red-700 bg-red-100';
      case 'em_andamento': return 'text-blue-700 bg-blue-100';
      case 'pendente': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const formatStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      case 'em_andamento': return 'Em Andamento';
      case 'pendente': return 'Pendente';
      default: return status || 'Não definido';
    }
  };

  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 opacity-0 animate-scale-in">
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <h2 className="text-2xl font-bold">
            {isInterviewEvent ? 'Detalhes da Entrevista' : 'Detalhes do Compromisso'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X size={28} />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Informações Básicas do Evento */}
          <div className={`p-6 rounded-lg border ${
            isInterviewEvent 
              ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
          }`}>
            <h3 className={`text-2xl font-bold mb-3 ${
              isInterviewEvent ? 'text-orange-800' : 'text-indigo-800'
            }`}>
              {event.title || 'Evento sem título'}
            </h3>
            <div className={`flex items-center mb-2 ${
              isInterviewEvent ? 'text-orange-600' : 'text-indigo-600'
            }`}>
              <Calendar size={18} className="mr-3" />
              <span className="font-medium">{formatDate(eventStart)}</span>
            </div>
            <div className={`flex items-center ${
              isInterviewEvent ? 'text-orange-600' : 'text-indigo-600'
            }`}>
              <Clock size={18} className="mr-3" />
              <span className="font-medium">{formatTime(eventStart)} - {formatTime(eventEnd)}</span>
            </div>
          </div>

          {isInterviewEvent && candidateDetails ? (
            <div className="space-y-6">
              {/* Informações Principais do Candidato */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Informações Básicas */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <User size={24} className="text-blue-600 mr-3" />
                    <h4 className="text-lg font-bold text-gray-800">Informações do Candidato</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">Nome Completo</p>
                      <p className="text-base font-medium text-gray-800">{candidateDetails.nome}</p>
                    </div>
                    
                    {candidateDetails.email && (
                      <div className="flex items-start">
                        <Mail size={16} className="text-gray-400 mr-3 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="text-sm text-gray-800 break-all">{candidateDetails.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {candidateDetails.telefone && (
                      <div className="flex items-start">
                        <Phone size={16} className="text-gray-400 mr-3 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Telefone</p>
                          <p className="text-sm text-gray-800">{candidateDetails.telefone}</p>
                        </div>
                      </div>
                    )}
                    
                    {candidateDetails.idade && (
                      <div className="flex items-start">
                        <User size={16} className="text-gray-400 mr-3 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Idade</p>
                          <p className="text-sm text-gray-800">{candidateDetails.idade} anos</p>
                        </div>
                      </div>
                    )}

                    {candidateDetails.curriculo && (
                      <div className="flex items-start">
                        <ExternalLink size={16} className="text-gray-400 mr-3 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Currículo</p>
                          <p className="text-sm text-blue-600">Disponível</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance e Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <TrendingUp size={24} className="text-green-600 mr-3" />
                    <h4 className="text-lg font-bold text-gray-800">Performance</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {candidateDetails.score && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">Score de Triagem</p>
                        <div className="flex items-center">
                          <div className={`px-3 py-2 rounded-lg font-bold text-lg ${getScoreColor(candidateDetails.score)}`}>
                            {candidateDetails.score}%
                          </div>
                          <Star size={20} className="ml-2 text-yellow-500" />
                        </div>
                      </div>
                    )}
                    
                    {candidateDetails.status && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">Status Atual</p>
                        <span className={`px-3 py-2 rounded-lg font-medium text-sm ${getStatusColor(getSafeValue(candidateDetails.status))}`}>
                          {formatStatus(getSafeValue(candidateDetails.status))}
                        </span>
                      </div>
                    )}

                    {candidateDetails.vaga && Array.isArray(candidateDetails.vaga) && candidateDetails.vaga.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">Vaga</p>
                        <div className="flex items-center">
                          <Briefcase size={16} className="text-gray-400 mr-2" />
                          <p className="text-sm text-gray-800">{getSafeValue(candidateDetails.vaga[0]?.titulo || candidateDetails.vaga[0])}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <Award size={24} className="text-purple-600 mr-3" />
                    <h4 className="text-lg font-bold text-gray-800">Informações Adicionais</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {candidateDetails.escolaridade && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">Escolaridade</p>
                        <p className="text-sm text-gray-800">{getSafeValue(candidateDetails.escolaridade)}</p>
                      </div>
                    )}

                    {candidateDetails.sexo && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">Sexo</p>
                        <p className="text-sm text-gray-800">{getSafeValue(candidateDetails.sexo)}</p>
                      </div>
                    )}

                    {candidateDetails.data_triagem && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">Data da Triagem</p>
                        <p className="text-sm text-gray-800">{new Date(candidateDetails.data_triagem).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}

                    {candidateDetails.behavioral_test_status && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">Status Teste Comportamental</p>
                        <p className="text-sm text-gray-800">{getSafeValue(candidateDetails.behavioral_test_status)}</p>
                      </div>
                    )}

                    {candidateDetails.theoretical_test_status && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">Status Teste Teórico</p>
                        <p className="text-sm text-gray-800">{getSafeValue(candidateDetails.theoretical_test_status)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resumo IA (se disponível) */}
              {candidateDetails.resumo_ia && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <BrainCircuit size={24} className="text-blue-600 mr-3" />
                    <h4 className="text-lg font-bold text-gray-800">Resumo IA</h4>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{candidateDetails.resumo_ia}</p>
                </div>
              )}

              {/* Perfil Comportamental */}
              {(candidateDetails.perfil_executor || candidateDetails.perfil_comunicador || candidateDetails.perfil_planejador || candidateDetails.perfil_analista) && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Star size={24} className="text-green-600 mr-3" />
                    <h4 className="text-lg font-bold text-gray-800">Perfil Comportamental</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {candidateDetails.perfil_executor && (
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-500 mb-1">Executor</p>
                        <p className="text-lg font-bold text-green-600">{candidateDetails.perfil_executor}%</p>
                      </div>
                    )}
                    {candidateDetails.perfil_comunicador && (
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-500 mb-1">Comunicador</p>
                        <p className="text-lg font-bold text-blue-600">{candidateDetails.perfil_comunicador}%</p>
                      </div>
                    )}
                    {candidateDetails.perfil_planejador && (
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-500 mb-1">Planejador</p>
                        <p className="text-lg font-bold text-purple-600">{candidateDetails.perfil_planejador}%</p>
                      </div>
                    )}
                    {candidateDetails.perfil_analista && (
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-500 mb-1">Analista</p>
                        <p className="text-lg font-bold text-orange-600">{candidateDetails.perfil_analista}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Modal para eventos não-entrevista */
            <div className="space-y-4">
              {event.description && !event.description.startsWith('{') && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Descrição</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
              
              {event.location && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Localização</h4>
                  <p className="text-gray-700">{event.location}</p>
                </div>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="border-t pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {isInterviewEvent && candidateDetails?.curriculo && (
                <a
                  href={candidateDetails.curriculo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-md transition-colors bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                >
                  <User size={16} />
                  Baixar Currículo
                </a>
              )}
              
              <a
                href={event.htmlLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-md transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                <ExternalLink size={16} />
                Abrir no Google Calendar
              </a>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default GoogleEventDetailModal;