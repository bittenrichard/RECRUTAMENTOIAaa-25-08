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

// Cache simples no lado do cliente
interface CacheEntry {
  data: GoogleCalendarEvent[];
  timestamp: number;
  userId: number;
}

export class GoogleCalendarService {
  private static cache: CacheEntry | null = null;
  private static readonly CACHE_TTL = 10000; // 10 segundos

  static async listEvents(userId: number): Promise<GoogleCalendarEvent[]> {
    try {
      console.log('[DEBUG] GoogleCalendarService.listEvents - userId:', userId);
      
      // Verificar cache
      if (this.cache && this.cache.userId === userId) {
        const now = Date.now();
        const age = now - this.cache.timestamp;
        
        if (age < this.CACHE_TTL) {
          console.log('[DEBUG] ✅ CACHE HIT - Retornando dados em cache (' + Math.round(age/1000) + 's atrás)');
          return this.cache.data;
        } else {
          console.log('[DEBUG] 🔄 CACHE EXPIRED - Cache expirado, fazendo nova requisição');
          this.cache = null;
        }
      }
      
      console.log('[DEBUG] 🚀 NOVA REQUISIÇÃO - Fazendo request para API');
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
      
      const events = data.events || [];
      
      // Salvar no cache
      this.cache = {
        data: events,
        timestamp: Date.now(),
        userId: userId
      };
      console.log('[DEBUG] 💾 CACHE SALVO - Dados salvos no cache');
      
      return events;
    } catch (error) {
      console.error('[ERROR] Erro ao listar eventos:', error);
      throw error;
    }
  }

  // Método para limpar o cache
  static clearCache(): void {
    console.log('[DEBUG] 🗑️ CACHE LIMPO - Cache foi limpo manualmente');
    this.cache = null;
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
      
      // Limpar cache após modificação
      this.clearCache();
      
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
      
      // Limpar cache após modificação
      this.clearCache();
      
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
      
      // Limpar cache após modificação
      this.clearCache();
      
      return data.data;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }
}