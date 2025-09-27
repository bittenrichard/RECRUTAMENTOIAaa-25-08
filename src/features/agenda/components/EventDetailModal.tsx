// Local: src/features/agenda/components/EventDetailModal.tsx

import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Calendar, Link as LinkIcon, Info, Download, Phone, Mail, MapPin, Award, TrendingUp, Clock, FileText, Star } from 'lucide-react';
import { CalendarEvent } from '../types';
import { Candidate } from '../../../shared/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDataStore } from '../../../shared/store/useDataStore';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  const { candidates } = useDataStore();
  const [candidateDetails, setCandidateDetails] = useState<Candidate | null>(null);

  // Buscar dados completos do candidato
  useEffect(() => {
    if (event && candidates) {
      const candidateReference = event.resource.Candidato && event.resource.Candidato[0];
      if (candidateReference) {
        const fullCandidate = candidates.find(c => 
          c.id === candidateReference.id || 
          c.nome === candidateReference.nome ||
          c.nome === candidateReference.value
        );
        setCandidateDetails(fullCandidate || null);
      }
    }
  }, [event, candidates]);

  if (!event) return null;

  const { resource } = event;
  const candidateReference = resource.Candidato && resource.Candidato[0];
  const job = resource.Vaga && resource.Vaga[0];


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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 opacity-0 animate-scale-in">
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
          <h2 className="text-2xl font-bold">Detalhes da Entrevista</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X size={28} />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Informações Básicas da Entrevista */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-200">
            <h3 className="text-2xl font-bold text-indigo-800 mb-3">{event.title}</h3>
            <div className="flex items-center text-indigo-600 mb-2">
              <Calendar size={18} className="mr-3" />
              <span className="font-medium">{formatDate(event.start)}</span>
            </div>
            <div className="flex items-center text-indigo-600">
              <Clock size={18} className="mr-3" />
              <span className="font-medium">{formatTime(event.start)} - {formatTime(event.end)}</span>
            </div>
          </div>

          {candidateDetails ? (
            <>
              {/* Resumo do Candidato */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <User size={24} className="text-blue-600 mr-3" />
                    <h4 className="text-xl font-bold text-gray-800">Informações do Candidato</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">Nome Completo</p>
                      <p className="text-lg font-medium text-gray-800">{candidateDetails.nome}</p>
                    </div>
                    
                    {candidateDetails.email && (
                      <div className="flex items-center">
                        <Mail size={16} className="text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="text-gray-800">{candidateDetails.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {candidateDetails.telefone && (
                      <div className="flex items-center">
                        <Phone size={16} className="text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Telefone</p>
                          <p className="text-gray-800">{candidateDetails.telefone}</p>
                        </div>
                      </div>
                    )}
                    
                    {candidateDetails.idade && (
                      <div className="flex items-center">
                        <MapPin size={16} className="text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Idade</p>
                          <p className="text-gray-800">{candidateDetails.idade} anos</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance e Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <TrendingUp size={24} className="text-green-600 mr-3" />
                    <h4 className="text-xl font-bold text-gray-800">Performance</h4>
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
                        <span className={`px-3 py-2 rounded-lg font-medium ${getStatusColor(candidateDetails.status.value)}`}>
                          {formatStatus(candidateDetails.status.value)}
                        </span>
                      </div>
                    )}
                    
                    {candidateDetails.ultima_atualizacao && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-1">Última Atualização</p>
                        <p className="text-gray-800">{new Date(candidateDetails.ultima_atualizacao).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vaga e Observações */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <Briefcase size={24} className="text-purple-600 mr-3" />
                    <h4 className="text-xl font-bold text-gray-800">Vaga</h4>
                  </div>
                  <p className="text-lg font-medium text-gray-800">{job?.titulo || 'Não informada'}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <FileText size={24} className="text-orange-600 mr-3" />
                    <h4 className="text-xl font-bold text-gray-800">Observações</h4>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{candidateDetails.resumo_ia || resource.Detalhes || 'Nenhuma observação adicional.'}</p>
                </div>
              </div>
            </>
          ) : (
            /* Caso não tenha detalhes do candidato */
            <div className="space-y-4">
              <div className="flex items-start">
                <User size={20} className="text-gray-400 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">Candidato</p>
                  <p className="text-lg font-medium text-gray-800">{candidateReference?.nome || candidateReference?.value || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Briefcase size={20} className="text-gray-400 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">Vaga</p>
                  <p className="text-lg font-medium text-gray-800">{job?.titulo || 'Não informada'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Info size={20} className="text-gray-400 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">Detalhes Adicionais</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{resource.Detalhes || 'Nenhum detalhe adicional fornecido.'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="border-t pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {candidateDetails?.curriculo && (
                <a
                  href={candidateDetails.curriculo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-md transition-colors bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                >
                  <Download size={16} />
                  Baixar Currículo
                </a>
              )}
              
              <button
                onClick={() => window.open(`https://calendar.google.com`, '_blank')}
                className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-md transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                <LinkIcon size={16} />
                Abrir Google Calendar
              </button>
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

export default EventDetailModal;