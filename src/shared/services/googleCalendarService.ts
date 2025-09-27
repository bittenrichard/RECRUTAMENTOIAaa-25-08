// src/shared/services/googleCalendarService.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
  htmlLink: string;
  status: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}

export class GoogleCalendarService {
  static async listEvents(userId: number): Promise<GoogleCalendarEvent[]> {
    try {
      console.log('[DEBUG] GoogleCalendarService.listEvents - userId:', userId);
      console.log('[DEBUG] API_BASE_URL:', API_BASE_URL);
      
      const url = `${API_BASE_URL}/api/google/calendar/events/${userId}`;
      console.log('[DEBUG] Fazendo request para:', url);
      
      const response = await fetch(url);
      console.log('[DEBUG] Response status:', response.status);
      console.log('[DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}` };
        }
        
        console.error('[DEBUG] Response error:', errorData);
        
        // Se o token expirou, mostrar mensagem específica
        if (response.status === 401 && errorData.error_code === 'TOKEN_EXPIRED') {
          throw new Error('Token do Google expirado. Vá em Configurações e reconecte sua conta Google.');
        }
        
        throw new Error(errorData.message || `Falha ao buscar eventos do Google Calendar: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[DEBUG] Response data:', data);
      console.log('[DEBUG] Número de eventos recebidos:', data.events?.length || 0);
      return data.events || [];
    } catch (error) {
      console.error('[ERROR] Erro ao listar eventos:', error);
      throw error;
    }
  }

  static async updateEvent(eventId: string, userId: number, eventData: EventFormData): Promise<GoogleCalendarEvent> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/google/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          eventData,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar evento no Google Calendar');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }

  static async deleteEvent(eventId: string, userId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/google/calendar/events/${eventId}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir evento do Google Calendar');
      }
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      throw error;
    }
  }

  static async createEvent(userId: number, eventData: EventFormData): Promise<GoogleCalendarEvent> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/google/calendar/create-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          eventData,
          candidate: { nome: 'Evento Manual', telefone: '' },
          job: { titulo: 'Evento Manual' },
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar evento no Google Calendar');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }
}