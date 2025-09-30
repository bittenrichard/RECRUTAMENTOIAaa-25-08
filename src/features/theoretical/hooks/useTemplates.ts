// Local: src/features/theoretical/hooks/useTemplates.ts

import { useState, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface Template {
  id: string;
  nome: string;
  descricao: string;
  tempo_limite: number;
  total_questoes: number;
  questoes: Array<{
    id: string;
    tipo: 'verdadeiro_falso' | 'dissertativa' | 'multipla_escolha';
    enunciado: string;
    opcoes?: string[];
    pontuacao: number;
    dificuldade?: 'facil' | 'media' | 'dificil';
  }>;
  is_template: boolean;
  created_at?: string;
  updated_at?: string;
}

interface DuplicateTemplateData {
  userId: string;
  customName?: string;
  customDescription?: string;
}

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const clearError = useCallback(() => setError(null), []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/theoretical-templates`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': profile?.id?.toString() || '1'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar templates');
      }

      const data = await response.json();
      setTemplates(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const duplicateTemplate = useCallback(async (templateId: string, data: DuplicateTemplateData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/theoretical-templates/${templateId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': profile?.id?.toString() || '1'
        },
        body: JSON.stringify({
          userId: profile?.id?.toString() || '1',
          customName: data.customName,
          customDescription: data.customDescription
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao duplicar template');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    duplicateTemplate,
    clearError
  };
};