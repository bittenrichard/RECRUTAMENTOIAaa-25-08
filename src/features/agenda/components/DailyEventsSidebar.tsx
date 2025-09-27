// Local: src/features/agenda/components/DailyEventsSidebar.tsx

import React, { useState } from 'react';
import { GoogleCalendarEvent } from '../../../shared/services/googleCalendarService';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Eye } from 'lucide-react';
import GoogleEventDetailModal from './GoogleEventDetailModal';

interface DailyEventsSidebarProps {
  selectedDate: Date;
  googleEvents: GoogleCalendarEvent[];
}

const DailyEventsSidebar: React.FC<DailyEventsSidebarProps> = ({ 
  selectedDate, 
  googleEvents
}) => {
  const [selectedEvent, setSelectedEvent] = useState<GoogleCalendarEvent | null>(null);

  const formattedDayOfWeek = format(selectedDate, 'EEEE', { locale: ptBR });
  const formattedFullDate = format(selectedDate, "dd 'de' MMMM", { locale: ptBR });

  // Filtrar eventos do Google Calendar para o dia selecionado
  const filteredGoogleEvents = googleEvents.filter(event => {
    const eventDate = new Date(event.start);
    return isSameDay(eventDate, selectedDate);
  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // SIMPLIFICADO: Identificar entrevistas pelo título
  const isInterviewEvent = (event: GoogleCalendarEvent) => {
    return event.title?.toLowerCase().includes('entrevista');
  };

  const getEventColor = (event: GoogleCalendarEvent) => {
    if (isInterviewEvent(event)) {
      return '#f97316'; // Orange para entrevistas
    }
    return '#3b82f6'; // Cor padrão azul
  };

  // Extrair nome do candidato do título (formato: "Entrevista - Nome do Candidato")
  const getCandidateName = (event: GoogleCalendarEvent) => {
    const title = event.title || '';
    if (title.includes('Entrevista - ')) {
      return title.replace('Entrevista - ', '').trim();
    }
    return null;
  };

  const handleViewDetails = (event: GoogleCalendarEvent) => {
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  return (
    <>
      <div className="p-4 lg:p-6 xl:p-8 h-full flex flex-col">
        <h3 className="text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 mb-1">Compromissos do Dia</h3>
        <p className="text-sm lg:text-base text-gray-500 mb-4 lg:mb-6 capitalize">{formattedDayOfWeek}, {formattedFullDate}</p>

        <div className="flex-grow overflow-y-auto hide-scrollbar">
          {filteredGoogleEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm">Nenhum compromisso para este dia.</p>
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-4 xl:space-y-5">
              {filteredGoogleEvents.map((event) => {
                const eventDate = new Date(event.start);
                const endDate = new Date(event.end);
                const eventColor = getEventColor(event);
                const isInterview = isInterviewEvent(event);
                const candidateName = getCandidateName(event);

                return (
                  <div
                    key={`google-${event.id}`}
                    className="bg-white rounded-lg border border-gray-200 p-4 lg:p-5 xl:p-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-gray-300"
                    style={{ borderLeft: `4px solid ${eventColor}` }}
                    onClick={() => handleViewDetails(event)}
                  >
                    {/* Cabeçalho com horário e tipo */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            {format(eventDate, 'HH:mm')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(endDate, 'HH:mm')}
                          </div>
                        </div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="flex-1">
                          <h4 className="text-sm lg:text-base xl:text-lg font-semibold text-gray-900 leading-tight">
                            {event.title || 'Evento sem título'}
                          </h4>
                          {candidateName && (
                            <p className="text-xs lg:text-sm text-gray-600 mt-1">
                              Candidato: {candidateName}
                            </p>
                          )}
                        </div>
                      </div>
                      {isInterview && (
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                          ENTREVISTA
                        </span>
                      )}
                    </div>
                    
                    {/* Descrição simples do evento */}
                    {event.description && (
                      <div className="bg-gray-50 rounded-md p-3 mb-3">
                        <p className="text-sm text-gray-700">
                          {event.description.length > 100 
                            ? `${event.description.substring(0, 100)}...` 
                            : event.description
                          }
                        </p>
                      </div>
                    )}
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Google Calendar
                      </span>
                      <div className="flex items-center text-xs text-blue-600 hover:text-blue-700">
                        <Eye size={12} className="mr-1" />
                        <span>Ver detalhes</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      <GoogleEventDetailModal 
        event={selectedEvent} 
        onClose={closeModal} 
      />
    </>
  );
};

export default DailyEventsSidebar;