// Local: src/shared/hooks/useGoogleAuth.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { UserProfile } from '../../features/auth/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const hasGoogleToken = (profile: UserProfile | null): boolean => {
  return !!profile && !!profile.google_refresh_token;
};

export const useGoogleAuth = () => {
  const { profile, updateProfile, refetchProfile } = useAuth();
  const [isGoogleConnected, setIsGoogleConnected] = useState(hasGoogleToken(profile));
  
  const isConnecting = useRef(false);

  useEffect(() => {
    setIsGoogleConnected(hasGoogleToken(profile));
  }, [profile]);
  
  useEffect(() => {
    const handleFocus = () => {
      if (isConnecting.current) {
        console.log("[useGoogleAuth] Janela principal recuperou o foco. Verificando status da conexão...");
        refetchProfile();
        isConnecting.current = false;
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchProfile]);

  const connectGoogleCalendar = useCallback(async () => {
    if (!profile) {
      alert('Você precisa estar logado para conectar sua agenda.');
      return;
    }
    
    // Verifica se estamos em desenvolvimento
    const isDevelopment = window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      const userConfirm = confirm(`
🚧 INTEGRAÇÃO GOOGLE CALENDAR - MODO DESENVOLVIMENTO 🚧

As credenciais OAuth estão configuradas para produção.

OPÇÕES PARA TESTAR:

1. ✅ CONTINUAR - Vai abrir o popup de autenticação, mas pode dar erro
2. ❌ CANCELAR - Para por aqui

Para funcionar 100%, você precisa:
• Criar credenciais OAuth separadas para desenvolvimento no Google Cloud Console
• Adicionar http://localhost:3001/api/google/auth/callback como URI autorizada

Deseja continuar mesmo assim?
      `);
      
      if (!userConfirm) {
        return;
      }
    }
    
    try {
      console.log('Iniciando conexão com Google Calendar...');
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Profile ID:', profile.id);
      
      const response = await fetch(`${API_BASE_URL}/api/google/auth/connect?userId=${profile.id}`);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Resposta inesperada do servidor:", textResponse);
        alert(`Erro na autenticação: ${response.status} - ${textResponse || 'Resposta vazia do servidor'}`);
        throw new Error('Falha ao obter URL de autenticação.');
      }
      
      const { url } = await response.json();
      console.log('URL de autenticação recebida:', url);
      
      if (url) {
        isConnecting.current = true;
        // Mostrar aviso específico para desenvolvimento
        if (isDevelopment) {
          console.warn('⚠️ AVISO: Em desenvolvimento, o callback pode falhar porque as credenciais OAuth não estão configuradas para localhost');
        }
        window.open(url, '_blank', 'width=600,height=700,noopener,noreferrer');
      }
    } catch (error) {
      console.error('Erro ao iniciar conexão com Google:', error);
      alert('Não foi possível iniciar a conexão com o Google Calendar. Verifique o console para mais detalhes.');
    }
  }, [profile]);

  const disconnectGoogleCalendar = useCallback(async () => {
    if (!profile) return;
    try {
      await fetch(`${API_BASE_URL}/api/google/auth/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });
      const updatedProfile = { ...profile, google_refresh_token: null };
      updateProfile(updatedProfile);
    } catch (error) {
      console.error('Erro ao desconectar do Google:', error);
      alert('Não foi possível desconectar a conta do Google.');
    }
  }, [profile, updateProfile]);

  return {
    isGoogleConnected,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  };
};