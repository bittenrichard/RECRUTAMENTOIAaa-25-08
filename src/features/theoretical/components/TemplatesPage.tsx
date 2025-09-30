// Local: src/features/theoretical/components/TemplatesPage.tsx

import React, { useState, useEffect } from 'react';
import { Copy, FileText, Clock, HelpCircle, Plus, CheckCircle } from 'lucide-react';
import { useTemplates } from '../hooks/useTemplates';

interface TemplatesPageProps {
  onTemplateCreated?: () => void;
}

const TemplatesPage: React.FC<TemplatesPageProps> = ({ onTemplateCreated }) => {
  const { templates, loading, error, fetchTemplates, duplicateTemplate, clearError } = useTemplates();
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleDuplicateClick = (templateId: string, templateName: string) => {
    setShowDuplicateModal(templateId);
    setCustomName(`${templateName} - Minha Cópia`);
    setCustomDescription('');
  };

  const handleConfirmDuplicate = async () => {
    if (!showDuplicateModal) return;

    setDuplicatingId(showDuplicateModal);
    try {
      await duplicateTemplate(showDuplicateModal, {
        userId: '1', // Will be set by the hook
        customName: customName.trim(),
        customDescription: customDescription.trim()
      });
      
      setSuccessMessage('Template duplicado com sucesso! Agora você pode editá-lo em "Meus Modelos".');
      setShowDuplicateModal(null);
      setCustomName('');
      setCustomDescription('');
      onTemplateCreated?.();
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setDuplicatingId(null);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getQuestionTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'verdadeiro_falso':
        return '✓/✗';
      case 'multipla_escolha':
        return '◉';
      case 'dissertativa':
        return '✎';
      default:
        return '?';
    }
  };

  const getQuestionTypes = (questoes: any[]) => {
    const counts = {
      verdadeiro_falso: 0,
      dissertativa: 0,
      multipla_escolha: 0
    };

    questoes.forEach(questao => {
      counts[questao.tipo as keyof typeof counts]++;
    });

    return counts;
  };

  if (loading && templates.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Carregando templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Templates de Prova Teórica</h1>
        <p className="text-gray-600 mt-1">
          Selecione um template e duplique para sua conta para personalizar e usar com seus candidatos
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
            <div className="text-sm text-green-700">{successMessage}</div>
          </div>
        </div>
      )}

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

      {/* Templates Grid */}
      {templates.length === 0 && !loading ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum template disponível
          </h3>
          <p className="text-gray-600">
            Entre em contato com o administrador para adicionar templates
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            const questionCounts = getQuestionTypes(template.questoes);
            const totalQuestions = template.total_questoes;
            const totalPoints = template.questoes?.reduce((sum, q) => sum + q.pontuacao, 0) || 0;

            return (
              <div
                key={template.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{template.nome}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Template
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{template.descricao}</p>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {totalQuestions} questões
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {template.tempo_limite} min
                    </div>
                    <div className="flex items-center gap-1">
                      <HelpCircle className="w-4 h-4" />
                      {totalPoints} pts
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {/* Question Type Breakdown */}
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Tipos de Questão
                    </h4>
                    <div className="space-y-1 text-sm">
                      {questionCounts.verdadeiro_falso > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 flex items-center gap-1">
                            <span className="font-mono text-xs">✓/✗</span>
                            Verdadeiro/Falso:
                          </span>
                          <span className="text-gray-900">{questionCounts.verdadeiro_falso}</span>
                        </div>
                      )}
                      {questionCounts.multipla_escolha > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 flex items-center gap-1">
                            <span className="font-mono text-xs">◉</span>
                            Múltipla Escolha:
                          </span>
                          <span className="text-gray-900">{questionCounts.multipla_escolha}</span>
                        </div>
                      )}
                      {questionCounts.dissertativa > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 flex items-center gap-1">
                            <span className="font-mono text-xs">✎</span>
                            Dissertativa:
                          </span>
                          <span className="text-gray-900">{questionCounts.dissertativa}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-gray-500 mb-4">
                    <div>Criado: {formatDate(template.created_at)}</div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleDuplicateClick(template.id, template.nome)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={duplicatingId === template.id}
                  >
                    {duplicatingId === template.id ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Duplicando...
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Duplicar Template
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Duplicar Template
            </h3>
            <p className="text-gray-600 mb-4">
              Personalize o nome e descrição do template antes de duplicar:
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Modelo
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome do seu modelo personalizado"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Descrição personalizada do modelo"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDuplicateModal(null);
                  setCustomName('');
                  setCustomDescription('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                disabled={duplicatingId === showDuplicateModal}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDuplicate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={duplicatingId === showDuplicateModal || !customName.trim()}
              >
                {duplicatingId === showDuplicateModal ? 'Duplicando...' : 'Duplicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;