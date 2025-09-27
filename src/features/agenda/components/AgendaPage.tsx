// Local: src/features/agenda/components/AgendaPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarEvent, ScheduleEvent } from '../types';

import EditEventModal from './EditEventModal';
import DailyEventsSidebar from './DailyEventsSidebar'; 
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useGoogleAuth } from '../../../shared/hooks/useGoogleAuth';
import MonthView from './MonthView'; 
import WeekView from './WeekView'; 
import DayView from './DayView';
import { GoogleCalendarService, GoogleCalendarEvent, EventFormData } from '../../../shared/services/googleCalendarService';   



type CustomView = 'month' | 'week' | 'day';

const generateColorForId = (id: number) => {
  const colors = [
    '#4f46e5', '#059669', '#db2777', '#d97706', '#0891b2', 
    '#6d28d9', '#be185d', '#ef4444', '#f97316', '#eab308', 
    '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', 
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
  ];
  return colors[id % colors.length];
};

const AgendaPage: React.FC = () => {
  const { profile } = useAuth();
  const { isGoogleConnected } = useGoogleAuth();
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGoogleEvent, setSelectedGoogleEvent] = useState<GoogleCalendarEvent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayForSidebar, setSelectedDayForSidebar] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<CustomView>('month');

  const vagaColorMap = useMemo(() => {
    const map = new Map<number, string>();
    // Gerar cores baseado nos eventos do Google Calendar que têm metadados de vaga
    googleEvents.forEach(event => {
      if (event.description) {
        try {
          const metadata = JSON.parse(event.description);
          if (metadata.vagaId && !map.has(metadata.vagaId)) {
            map.set(metadata.vagaId, generateColorForId(metadata.vagaId));
          }
        } catch {
          // Ignorar se não for JSON válido
        }
      }
    });
    return map;
  }, [googleEvents]);

  // Função simples para gerar hash de string
  const stringToHash = useCallback((str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }, []);

  // Função para converter GoogleCalendarEvent em CalendarEvent
  const convertGoogleEventToCalendarEvent = useCallback((googleEvent: GoogleCalendarEvent): CalendarEvent => {
    console.log('[CONVERT DEBUG] Convertendo evento:', {
      id: googleEvent.id,
      title: googleEvent.title,
      start: googleEvent.start,
      startType: typeof googleEvent.start,
      end: googleEvent.end,
      endType: typeof googleEvent.end
    });
    
    const startDate = new Date(googleEvent.start);
    const endDate = new Date(googleEvent.end);
    
    console.log('[CONVERT DEBUG] Datas convertidas:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startValid: !isNaN(startDate.getTime()),
      endValid: !isNaN(endDate.getTime())
    });
    
    return {
      title: googleEvent.title,
      start: startDate,
      end: endDate,
      resource: {
        id: -stringToHash(googleEvent.id), // ID negativo para distinguir de eventos do sistema
        Título: googleEvent.title,
        Início: googleEvent.start,
        Fim: googleEvent.end,
        Detalhes: googleEvent.description || '',
        Candidato: [],
        Vaga: [],
        // Adicionar metadados para identificar como evento do Google
        isGoogleEvent: true,
        googleEventId: googleEvent.id,
        location: googleEvent.location,
        htmlLink: googleEvent.htmlLink
      } as ScheduleEvent & { isGoogleEvent: true; googleEventId: string; location?: string; htmlLink: string }
    };
  }, [stringToHash]);

  // Converter eventos do Google Calendar para formato da agenda
  const allEvents = useMemo(() => {
    const convertedGoogleEvents = googleEvents.map(convertGoogleEventToCalendarEvent);
    console.log('[AGENDA DEBUG] Eventos do Google Calendar:', googleEvents.length);
    console.log('[AGENDA DEBUG] Eventos convertidos:', convertedGoogleEvents.length);
    
    return convertedGoogleEvents;
  }, [googleEvents, convertGoogleEventToCalendarEvent]);




  const fetchGoogleCalendarEvents = useCallback(async () => {
    console.log('[DEBUG] fetchGoogleCalendarEvents called:', {
      profileId: profile?.id,
      isGoogleConnected,
      hasProfile: !!profile
    });
    
    if (!profile?.id) {
      console.log('[DEBUG] Sem profile.id, cancelando fetch');
      return;
    }
    
    if (!isGoogleConnected) {
      console.log('[DEBUG] Google não conectado, cancelando fetch');
      return;
    }

    setIsSyncing(true);
    try {
      console.log('[DEBUG] Chamando GoogleCalendarService.listEvents...');
      const events = await GoogleCalendarService.listEvents(profile.id);
      console.log('[DEBUG] Eventos recebidos:', events);
      setGoogleEvents(events);
    } catch (error) {
      console.error('[ERROR] Erro ao buscar eventos do Google Calendar:', error);
      
      // Se for erro de token expirado, mostrar mensagem específica
      if (error instanceof Error && error.message.includes('Token do Google expirado')) {
        alert('⚠️ Token do Google Calendar expirado!\n\nPor favor, vá em Configurações e reconecte sua conta Google para sincronizar os eventos.');
      } else if (error instanceof Error && error.message.includes('não conectado')) {
        alert('📅 Google Calendar não conectado!\n\nPara sincronizar eventos, conecte sua conta Google clicando no botão "Conectar Google" ou em Configurações.');
      } else {
        console.error('Erro na sincronização:', error);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [profile, isGoogleConnected]);

  const handleUpdateGoogleEvent = useCallback(async (eventData: Partial<GoogleCalendarEvent>) => {
    if (!profile?.id || !selectedGoogleEvent) return;

    const formattedData: EventFormData = {
      title: eventData.title || selectedGoogleEvent.title,
      description: eventData.description || selectedGoogleEvent.description,
      start: eventData.start || selectedGoogleEvent.start,
      end: eventData.end || selectedGoogleEvent.end,
      location: eventData.location || selectedGoogleEvent.location,
    };

    try {
      await GoogleCalendarService.updateEvent(selectedGoogleEvent.id, profile.id, formattedData);
      await fetchGoogleCalendarEvents();
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }, [profile?.id, selectedGoogleEvent, fetchGoogleCalendarEvents]);

  const handleDeleteGoogleEvent = useCallback(async (eventId: string) => {
    if (!profile?.id) return;

    try {
      await GoogleCalendarService.deleteEvent(eventId, profile.id);
      await fetchGoogleCalendarEvents();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      throw error;
    }
  }, [profile?.id, fetchGoogleCalendarEvents]);

  const syncAllEvents = useCallback(async () => {
    if (!profile?.id || !isGoogleConnected) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await fetchGoogleCalendarEvents();
    } catch (error) {
      console.error('Erro ao sincronizar eventos:', error);
      setError('Erro ao carregar agenda do Google Calendar');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, isGoogleConnected, fetchGoogleCalendarEvents]);

  useEffect(() => {
    syncAllEvents();
  }, [syncAllEvents]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    // Encontrar o evento do Google Calendar correspondente
    const googleEvent = googleEvents.find(ge => ge.id === (event.resource as any).googleEventId);
    if (googleEvent) {
      setSelectedGoogleEvent(googleEvent);
      setShowEditModal(true);
    }
  }, [googleEvents]);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDayForSidebar(date);
    setIsSidebarOpen(true);
  }, []);

  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    let newDate = currentDate;
    if (direction === 'prev') {
      if (currentView === 'month') newDate = subMonths(currentDate, 1);
      else if (currentView === 'week') newDate = subWeeks(currentDate, 1);
      else if (currentView === 'day') newDate = subDays(currentDate, 1);
    } else if (direction === 'next') {
      if (currentView === 'month') newDate = addMonths(currentDate, 1);
      else if (currentView === 'week') newDate = addWeeks(currentDate, 1);
      else if (currentView === 'day') newDate = addDays(currentDate, 1);
    } else if (direction === 'today') {
      newDate = new Date();
    }
    setCurrentDate(newDate);
    setSelectedDayForSidebar(newDate);
  }, [currentDate, currentView]);

  const handleViewChange = useCallback((view: CustomView) => {
    setCurrentView(view);
  }, []);

  const getPeriodLabel = useMemo(() => {
    if (currentView === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    } else if (currentView === 'week') {
      const startOfWeekDate = startOfWeek(currentDate, { locale: ptBR });
      const endOfWeekDate = endOfWeek(currentDate, { locale: ptBR });
      const startDay = format(startOfWeekDate, 'd', { locale: ptBR });
      const endDay = format(endOfWeekDate, 'd', { locale: ptBR });
      const startMonth = format(startOfWeekDate, 'MMM', { locale: ptBR });
      const endMonth = format(endOfWeekDate, 'MMM', { locale: ptBR });

      if (startMonth === endMonth) {
        return `${startDay} - ${endDay} ${format(startOfWeekDate, 'MMMM yyyy', { locale: ptBR })}`;
      } else {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${format(endOfWeekDate, 'yyyy', { locale: ptBR })}`;
      }
    } else if (currentView === 'day') {
      return format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
    }
    return '';
  }, [currentDate, currentView]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fade-in flex h-full gap-4 lg:gap-6 p-4 lg:p-6 xl:p-8 2xl:p-10">
      <div className="flex flex-col flex-grow calendar-container">
        {error && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                {error}
            </div>
        )}
        
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center gap-2">
                <button 
                onClick={() => handleNavigate('prev')} 
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
                title="Período Anterior"
                >
                <ChevronLeft size={20} />
                </button>
                <h2 className="text-xl font-bold text-gray-800 capitalize flex-shrink-0 mx-2">
                {getPeriodLabel}
                </h2>
                <button 
                onClick={() => handleNavigate('next')} 
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
                title="Próximo Período"
                >
                <ChevronRight size={20} />
                </button>
            </div>
            


            <div className="flex items-center gap-4 ml-auto">
                <div className="inline-flex items-center bg-gray-100 p-1 rounded-lg"> 
                    <button
                        onClick={() => handleViewChange('month')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 
                        ${currentView === 'month'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Mês
                    </button>
                    <button
                        onClick={() => handleViewChange('week')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 
                        ${currentView === 'week'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => handleViewChange('day')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 
                        ${currentView === 'day'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Dia
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => handleNavigate('today')}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                    title="Ir para Hoje"
                >
                    Hoje
                </button>
                      <button
                          type="button"
                          onClick={() => {
                            console.log('[DEBUG] Redirecionando para configurações');
                            window.location.href = '/configuracoes';
                          }}
                          className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 transition-colors"
                          title="Ir para Configurações"
                      >
                          Configurações
                      </button>
            </div>
        </div>
        
        <div className="flex-grow relative h-full p-4">
            {currentView === 'month' && (
                <MonthView 
                    currentDate={currentDate} 
                    events={allEvents} 
                    onDayClick={handleDayClick} 
                    selectedDayForSidebar={selectedDayForSidebar}
                    vagaColorMap={vagaColorMap}
                    onSelectEvent={handleSelectEvent}
                />
            )}
            {currentView === 'week' && (
                <WeekView 
                    currentDate={currentDate} 
                    events={allEvents} 
                    onDayClick={handleDayClick} 
                    selectedDayForSidebar={selectedDayForSidebar} 
                    vagaColorMap={vagaColorMap} 
                    onSelectEvent={handleSelectEvent}
                />
            )}
            {currentView === 'day' && (
                <DayView 
                    currentDate={currentDate} 
                    events={allEvents} 
                    vagaColorMap={vagaColorMap} 
                    onSelectEvent={handleSelectEvent}
                />
            )}
        </div>
      </div>
      
      <div className={`
        flex-shrink-0 transition-all duration-300 ease-in-out
        ${isSidebarOpen 
          ? 'w-80 lg:w-96 xl:w-[28rem] 2xl:w-[32rem] ml-4 lg:ml-6' 
          : 'w-12 ml-4 lg:ml-6'
        }
        bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col relative
      `}>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`
            absolute p-1 rounded-full shadow-sm z-10 transition-transform duration-300
            flex items-center justify-center border border-gray-200
            ${isSidebarOpen 
              ? '-left-3 top-4 bg-white text-gray-500 hover:bg-gray-100'
              : 'left-1/2 -translate-x-1/2 top-4 bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
          title={isSidebarOpen ? "Esconder eventos diários" : "Mostrar eventos diários"}
        >
          {isSidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        {isSidebarOpen && (
          <DailyEventsSidebar
            selectedDate={selectedDayForSidebar}
            googleEvents={googleEvents}
          />
        )}
      </div>



      <EditEventModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGoogleEvent(null);
        }}
        event={selectedGoogleEvent}
        onSave={handleUpdateGoogleEvent}
        onDelete={handleDeleteGoogleEvent}
      />
    </div>
  );
};

export default AgendaPage;