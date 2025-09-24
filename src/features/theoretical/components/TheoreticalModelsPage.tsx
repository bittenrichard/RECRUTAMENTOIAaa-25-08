// Local: src/features/theoretical/components/TheoreticalModelsPage.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { TestModel } from '../../../shared/types';
import { useTheoreticalTests } from '../hooks/useTheoreticalTests';

// ✅ Definir o tipo localmente já que não está exportado
type UseTheoreticalTestsReturn = ReturnType<typeof useTheoreticalTests>;

interface TheoreticalModelsPageProps {
  onCreateModel?: () => void;
  onEditModel?: (model: TestModel) => void;
  onViewResults?: (modelId: string) => void;
  theoreticalTestsHook?: UseTheoreticalTestsReturn;
}

const TheoreticalModelsPage: React.FC<TheoreticalModelsPageProps> = ({
  onCreateModel,
  onEditModel,
  onViewResults,
  theoreticalTestsHook
}) => {
  // ✅ Usar o hook passado como prop ou criar uma nova instância
  const defaultHook = useTheoreticalTests();
  const {
    models,
    loading,
    error,
    fetchModels,
    deleteModel,
    updateModel,
    clearError
  } = theoreticalTestsHook || defaultHook;

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleDeleteClick = (modelId: string) => {
    setConfirmDelete(modelId);
  };

  const handleConfirmDelete = async (modelId: string) => {
    setDeletingId(modelId);
    try {
      await deleteModel(modelId);
      setConfirmDelete(null);
    } catch (error) {
      // Erro já tratado pelo hook
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (model: TestModel) => {
    try {
      await updateModel(model.id!, { ativo: !model.ativo });
    } catch (error) {
      // Erro já tratado pelo hook
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQuestionTypeCount = (model: TestModel) => {
    const counts = {
      verdadeiro_falso: 0,
      dissertativa: 0,
      multipla_escolha: 0
    };

    model.questoes?.forEach(questao => {
      counts[questao.tipo]++;
    });

    return counts;
  };

  if (loading && models.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Carregando modelos de prova...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modelos de Prova Teórica</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os modelos de prova que serão aplicados aos candidatos
          </p>
        </div>
        <button
          onClick={onCreateModel}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          <Plus className="w-4 h-4" />
          Novo Modelo
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Models Grid */}
      {models.length === 0 && !loading ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum modelo de prova encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Comece criando seu primeiro modelo de prova teórica
          </p>
          <button
            onClick={onCreateModel}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Modelo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => {
            const questionCounts = getQuestionTypeCount(model);
            const totalQuestions = model.questoes?.length || 0;
            const totalPoints = model.questoes?.reduce((sum, q) => sum + q.pontuacao, 0) || 0;

            return (
              <div
                key={model.id}
                className={`bg-white rounded-lg border ${
                  model.ativo ? 'border-gray-200' : 'border-gray-300 opacity-75'
                } shadow-sm hover:shadow-md transition-shadow`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{model.nome}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{model.descricao}</p>
                    </div>
                    <button
                      onClick={() => handleToggleActive(model)}
                      className={`ml-2 p-1 rounded ${
                        model.ativo 
                          ? 'text-green-600 hover:text-green-700' 
                          : 'text-gray-400 hover:text-gray-500'
                      }`}
                      title={model.ativo ? 'Desativar modelo' : 'Ativar modelo'}
                    >
                      {model.ativo ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {/* Stats */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {totalQuestions} questões • {totalPoints} pontos
                      </span>
                    </div>
                  </div>

                  {/* Question Type Breakdown */}
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Tipos de Questão
                    </h4>
                    <div className="space-y-1 text-sm">
                      {questionCounts.verdadeiro_falso > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Verdadeiro/Falso:</span>
                          <span className="text-gray-900">{questionCounts.verdadeiro_falso}</span>
                        </div>
                      )}
                      {questionCounts.multipla_escolha > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Múltipla Escolha:</span>
                          <span className="text-gray-900">{questionCounts.multipla_escolha}</span>
                        </div>
                      )}
                      {questionCounts.dissertativa > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dissertativa:</span>
                          <span className="text-gray-900">{questionCounts.dissertativa}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium pt-1 border-t border-gray-100">
                        <span className="text-gray-700">Pontuação Total:</span>
                        <span className="text-gray-900">{totalPoints} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-gray-500 mb-4">
                    <div>Criado: {formatDate(model.created_at)}</div>
                    {model.updated_at !== model.created_at && (
                      <div>Atualizado: {formatDate(model.updated_at)}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewResults?.(model.id!)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Resultados
                    </button>
                    <button
                      onClick={() => onEditModel?.(model)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(model.id!)}
                      className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                      disabled={deletingId === model.id}
                    >
                      {deletingId === model.id ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este modelo de prova? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                disabled={deletingId === confirmDelete}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmDelete(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={deletingId === confirmDelete}
              >
                {deletingId === confirmDelete ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TheoreticalModelsPage;