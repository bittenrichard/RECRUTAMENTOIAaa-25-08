// Local: src/features/theoretical/hooks/useTheoreticalTests.ts

import { useState, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { 
  TestModel, 
  AppliedTest, 
  CandidateTestData, 
  TestResult, 
  TestSubmission 
} from '../../../shared/types';

interface UseTheoreticalTestsReturn {
  // Estados
  models: TestModel[];
  currentTest: CandidateTestData | null;
  results: TestResult[];
  loading: boolean;
  error: string | null;
  
  // Operações CRUD para modelos
  fetchModels: () => Promise<void>;
  createModel: (model: Omit<TestModel, 'id' | 'created_at' | 'updated_at'>) => Promise<TestModel>;
  updateModel: (id: string, model: Partial<TestModel>) => Promise<TestModel>;
  deleteModel: (id: string) => Promise<void>;
  getModel: (id: string) => Promise<TestModel>;
  
  // Operações para testes aplicados
  generateTest: (candidateId: string, modelId: string) => Promise<AppliedTest>;
  getCandidateTest: (candidateId: string) => Promise<CandidateTestData | null>;
  submitTest: (testId: string, submission: TestSubmission) => Promise<{ pontuacao_total: number }>;
  getCandidateResults: (candidateId: string) => Promise<TestResult[]>;
  
  // Utilitários
  clearError: () => void;
  setCurrentTest: (test: CandidateTestData | null) => void;
}

export const useTheoreticalTests = (): UseTheoreticalTestsReturn => {
  const { profile } = useAuth();
  const [models, setModels] = useState<TestModel[]>([]);
  const [currentTest, setCurrentTestState] = useState<CandidateTestData | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiError = useCallback((error: unknown, defaultMessage: string) => {
    console.error(defaultMessage, error);
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    setError(errorMessage);
    throw new Error(errorMessage);
  }, []);

  const apiRequest = useCallback(async (
    endpoint: string, 
    options: RequestInit = {}
  ) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const userId = profile?.id || '1'; // Default para usuário 1 se não estiver logado
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(userId), // Incluir ID do usuário no header
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro na comunicação com o servidor' }));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }

    return response.json();
  }, [profile?.id]);

  // ========================================
  // OPERAÇÕES CRUD PARA MODELOS DE PROVA
  // ========================================

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/api/public/theoretical-models');
      setModels(response.data || []);
    } catch (error) {
      handleApiError(error, 'Erro ao carregar modelos de prova');
    } finally {
      setLoading(false);
    }
  }, [apiRequest, handleApiError]);

  const createModel = useCallback(async (modelData: Omit<TestModel, 'id' | 'created_at' | 'updated_at'>): Promise<TestModel> => {
    setLoading(true);
    setError(null);
    try {
      const userId = profile?.id || '1';
      const response = await apiRequest('/api/theoretical-models', {
        method: 'POST',
        body: JSON.stringify({ ...modelData, userId }),
      });
      
      const newModel = response.data;
      setModels(prev => [newModel, ...prev]);
      return newModel;
    } catch (error) {
      handleApiError(error, 'Erro ao criar modelo de prova');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiRequest, handleApiError, profile?.id]);

  const updateModel = useCallback(async (id: string, modelData: Partial<TestModel>): Promise<TestModel> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`/api/theoretical-models/${id}`, {
        method: 'PUT',
        body: JSON.stringify(modelData),
      });
      
      const updatedModel = response.data;
      setModels(prev => prev.map(model => 
        model.id === id ? updatedModel : model
      ));
      return updatedModel;
    } catch (error) {
      handleApiError(error, 'Erro ao atualizar modelo de prova');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiRequest, handleApiError]);

  const deleteModel = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest(`/api/theoretical-models/${id}`, {
        method: 'DELETE',
      });
      
      setModels(prev => prev.filter(model => model.id !== id));
    } catch (error) {
      handleApiError(error, 'Erro ao deletar modelo de prova');
    } finally {
      setLoading(false);
    }
  }, [apiRequest, handleApiError]);

  const getModel = useCallback(async (id: string): Promise<TestModel> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`/api/theoretical-models/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Erro ao buscar modelo de prova');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiRequest, handleApiError]);

  // ========================================
  // OPERAÇÕES PARA TESTES APLICADOS
  // ========================================

  const generateTest = useCallback(async (candidateId: string, modelId: string): Promise<AppliedTest> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/api/theoretical-test/generate', {
        method: 'POST',
        body: JSON.stringify({
          candidato_id: candidateId,
          modelo_prova_id: modelId,
        }),
      });
      
      return response.data;
    } catch (error) {
      handleApiError(error, 'Erro ao gerar prova para candidato');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiRequest, handleApiError]);

  const getCandidateTest = useCallback(async (candidateId: string): Promise<CandidateTestData | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`/api/theoretical-test/${candidateId}`);
      const testData = response.data;
      setCurrentTestState(testData);
      return testData;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Nenhuma prova em andamento')) {
        setCurrentTestState(null);
        return null;
      }
      handleApiError(error, 'Erro ao buscar prova do candidato');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiRequest, handleApiError]);

  const submitTest = useCallback(async (testId: string, submission: TestSubmission): Promise<{ pontuacao_total: number }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`/api/theoretical-test/${testId}/submit`, {
        method: 'PUT',
        body: JSON.stringify(submission),
      });
      
      // Limpar teste atual após submissão
      setCurrentTestState(null);
      
      return { pontuacao_total: response.pontuacao_total };
    } catch (error) {
      handleApiError(error, 'Erro ao submeter prova');
      throw error; // Re-throw para manter o tipo de retorno correto
    } finally {
      setLoading(false);
    }
  }, [apiRequest, handleApiError]);

  const getCandidateResults = useCallback(async (candidateId: string): Promise<TestResult[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`/api/theoretical-test/results/${candidateId}`);
      const resultsData = response.data || [];
      setResults(resultsData);
      return resultsData;
    } catch (error) {
      handleApiError(error, 'Erro ao buscar resultados das provas');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiRequest, handleApiError]);

  // ========================================
  // UTILITÁRIOS
  // ========================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setCurrentTest = useCallback((test: CandidateTestData | null) => {
    setCurrentTestState(test);
  }, []);

  return {
    // Estados
    models,
    currentTest,
    results,
    loading,
    error,
    
    // Operações CRUD para modelos
    fetchModels,
    createModel,
    updateModel,
    deleteModel,
    getModel,
    
    // Operações para testes aplicados
    generateTest,
    getCandidateTest,
    submitTest,
    getCandidateResults,
    
    // Utilitários
    clearError,
    setCurrentTest,
  };
};

export default useTheoreticalTests;