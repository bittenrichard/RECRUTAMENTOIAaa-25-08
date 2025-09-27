// Local: src/features/dashboard/components/TodaySchedule.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay } from 'date-fns';
import { Calendar, ChevronRight, Clock } from 'lucide-react';
import { GoogleCalendarEvent } from '../../../shared/services/googleCalendarService';

interface TodayScheduleProps {
  googleEvents: GoogleCalendarEvent[];
}

const TodaySchedule: React.FC<TodayScheduleProps> = ({ 
  googleEvents
}) => {
  const navigate = useNavigate();
  const today = new Date();

  // Filtrar eventos de hoje do Google Calendar
  const todayGoogleEvents = googleEvents.filter(event => 
    isSameDay(new Date(event.start), today)
  ).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // SIMPLIFICADO: Identificar entrevistas pelo título
  const isInterviewEvent = (event: GoogleCalendarEvent) => {
    return event.title?.toLowerCase().includes('entrevista');
  };

  // Extrair nome do candidato do título (formato: "Entrevista - Nome do Candidato")
  const getCandidateName = (event: GoogleCalendarEvent) => {
    const title = event.title || '';
    if (title.includes('Entrevista - ')) {
      return title.replace('Entrevista - ', '').trim();
    }
    return null;
  };



  const nextUpcomingEvent = todayGoogleEvents.find(event => 
    new Date(event.start).getTime() > Date.now()
  );

  if (todayGoogleEvents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-blue-600" />
            Compromissos de Hoje
          </h3>
          <button
            onClick={() => navigate('/agenda')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium"
          >
            Ver agenda
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-6 text-gray-500">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm">Nenhum compromisso agendado para hoje</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-blue-600" />
          Compromissos de Hoje
        </h3>
        <button
          onClick={() => navigate('/agenda')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium"
        >
          Ver todos ({todayGoogleEvents.length})
          <ChevronRight className="ml-1 h-4 w-4" />
        </button>
      </div>

      {nextUpcomingEvent && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-medium text-blue-600 mb-1 flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            PRÓXIMO COMPROMISSO
          </p>
          <p className="text-sm font-semibold text-blue-900">
            {nextUpcomingEvent.title || 'Evento sem título'}
          </p>
          <p className="text-xs text-blue-700">
            {format(new Date(nextUpcomingEvent.start), 'HH:mm')} - {format(new Date(nextUpcomingEvent.end), 'HH:mm')}
          </p>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {todayGoogleEvents.slice(0, 5).map((event: GoogleCalendarEvent, index: number) => {
          const eventColor = isInterviewEvent(event) ? '#f97316' : '#10b981'; // Orange for interviews, green for others
          const candidateName = getCandidateName(event);
          const isUpcoming = new Date(event.start).getTime() > Date.now();

          return (
            <div
              key={`${event.id}-${index}`}
              className={`flex items-center p-3 rounded-lg border ${
                isUpcoming ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-300'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                style={{ backgroundColor: eventColor }}
              />
              <div className="flex-grow min-w-0">
                <p className={`text-sm font-medium truncate ${
                  isUpcoming ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  {event.title || 'Evento sem título'}
                </p>
                <p className={`text-xs ${
                  isUpcoming ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}
                  {candidateName && (
                    <span className="ml-2">
                      • {candidateName}
                    </span>
                  )}
                </p>
              </div>
              {!isUpcoming && (
                <span className="text-xs text-gray-400 ml-2">Concluído</span>
              )}
            </div>
          );
        })}
        
        {todayGoogleEvents.length > 5 && (
          <button
            onClick={() => navigate('/agenda')}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2 font-medium"
          >
            Ver mais {todayGoogleEvents.length - 5} compromissos...
          </button>
        )}
      </div>
    </div>
  );
};

export default TodaySchedule;