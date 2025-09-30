// Hook temporário para gerenciar modo_trabalho localmente até a implementação no backend
import { useState, useEffect } from 'react';

interface WorkModeStorage {
  [jobId: string]: 'presencial' | 'remoto' | 'hibrido';
}

export const useWorkModeStorage = () => {
  const [workModeStorage, setWorkModeStorage] = useState<WorkModeStorage>({});

  useEffect(() => {
    // Carregar dados do localStorage na inicialização
    const stored = localStorage.getItem('workModeStorage');
    if (stored) {
      try {
        setWorkModeStorage(JSON.parse(stored));
      } catch (error) {
        console.warn('Erro ao carregar work mode storage:', error);
      }
    }
  }, []);

  const saveWorkMode = (jobId: string | number, workMode: 'presencial' | 'remoto' | 'hibrido') => {
    const newStorage = {
      ...workModeStorage,
      [jobId.toString()]: workMode
    };
    setWorkModeStorage(newStorage);
    localStorage.setItem('workModeStorage', JSON.stringify(newStorage));
  };

  const getWorkMode = (jobId: string | number): 'presencial' | 'remoto' | 'hibrido' | null => {
    return workModeStorage[jobId.toString()] || null;
  };

  const removeWorkMode = (jobId: string | number) => {
    const newStorage = { ...workModeStorage };
    delete newStorage[jobId.toString()];
    setWorkModeStorage(newStorage);
    localStorage.setItem('workModeStorage', JSON.stringify(newStorage));
  };

  return {
    saveWorkMode,
    getWorkMode,
    removeWorkMode
  };
};