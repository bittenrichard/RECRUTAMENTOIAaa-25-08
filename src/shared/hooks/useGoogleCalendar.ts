// Local: src/shared/hooks/useGoogleCalendar.ts

import { useState, useEffect, useCallback } from 'react';
import { GoogleCalendarEvent, GoogleCalendarService } from '../services/googleCalendarService';
import { useAuth } from '../../features/auth/hooks/useAuth';

export const useGoogleCalendar = () => {
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const fetchGoogleCalendarEvents = useCallback(async () => {
    if (!profile?.id) {
      console.log('[DEBUG] Profile not available, skipping Google Calendar fetch');
      return;
    }

    // Evitar múltiplas requisições simultâneas
    if (isLoading) {
      console.log('[DEBUG] Already loading, skipping duplicate request');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[DEBUG] Fetching Google Calendar events for user:', profile.id);
      const events = await GoogleCalendarService.listEvents(profile.id);
      console.log('[DEBUG] Google Calendar events fetched:', events.length, 'eventos');
      setGoogleEvents(events);
    } catch (error) {
      console.error('[DEBUG] Error fetching Google Calendar events:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar eventos');
      setGoogleEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, isLoading]);

  // Usar debounce para evitar muitas requisições
  useEffect(() => {
    if (!profile?.id) return;

    const timeoutId = setTimeout(() => {
      fetchGoogleCalendarEvents();
    }, 100); // Debounce reduzido para 100ms para responsividade

    return () => clearTimeout(timeoutId);
  }, [fetchGoogleCalendarEvents, profile?.id]);

  // Event listener para refresh quando eventos são criados
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[DEBUG] Event listener triggered - refreshing Google Calendar');
      fetchGoogleCalendarEvents();
    };

    window.addEventListener('refreshGoogleCalendar', handleRefresh);
    return () => {
      window.removeEventListener('refreshGoogleCalendar', handleRefresh);
    };
  }, [fetchGoogleCalendarEvents]);

  return {
    googleEvents,
    isLoading,
    error,
    refetch: fetchGoogleCalendarEvents
  };
};