// Local: src/features/theoretical/components/TestModelForm.tsx

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { TestModel, Question, QuestionType } from '../../../shared/types';
import { useTheoreticalTests } from '../hooks/useTheoreticalTests';

interface TestModelFormProps {
  model?: TestModel;
  onSave?: (model: TestModel) => void;
  onCancel?: () => void;
}

const TestModelForm: React.FC<TestModelFormProps> = ({
  model,
  onSave,
  onCancel
}) => {
  const { createModel, updateModel, loading, error, clearError } = useTheoreticalTests();

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tempo_limite: 60,
    ativo: true
  });

  const [questoes, setQuestoes] = useState<Question[]>([]);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Inicializar formulário com dados do modelo (para edição)
  useEffect(() => {
    if (model) {
      setFormData({
        nome: model.nome,
        descricao: model.descricao,
        tempo_limite: model.tempo_limite,
        ativo: model.ativo
      });
      setQuestoes(model.questoes || []);
    }
  }, [model]);

  // Limpar erro quando formulário muda
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validar dados básicos
    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }
    if (!formData.descricao.trim()) {
      errors.descricao = 'Descrição é obrigatória';
    }
    if (formData.tempo_limite < 5) {
      errors.tempo_limite = 'Tempo mínimo é 5 minutos';
    }

    // Validar questões
    if (questoes.length === 0) {
      errors.questoes = 'Pelo menos uma questão é obrigatória';
    }

    questoes.forEach((questao, index) => {
      if (!questao.enunciado.trim()) {
        errors[`questao_${index}_enunciado`] = 'Enunciado é obrigatório';
      }
      if (questao.pontuacao <= 0) {
        errors[`questao_${index}_pontuacao`] = 'Pontuação deve ser maior que zero';
      }
      
      if (questao.tipo === 'multipla_escolha') {
        if (!questao.opcoes || questao.opcoes.length < 2) {
          errors[`questao_${index}_opcoes`] = 'Pelo menos 2 opções são obrigatórias';
        }
        if (!questao.resposta_correta) {
          errors[`questao_${index}_resposta`] = 'Resposta correta é obrigatória';
        }
      }
      
      if (questao.tipo === 'verdadeiro_falso' && !questao.resposta_correta) {
        errors[`questao_${index}_resposta`] = 'Resposta correta é obrigatória';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const modelData = {
        ...formData,
        questoes
      };

      let savedModel: TestModel;
      if (model?.id) {
        savedModel = await updateModel(model.id, modelData);
      } else {
        savedModel = await createModel(modelData);
      }

      onSave?.(savedModel);
    } catch (error) {
      // Erro já tratado pelo hook
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      tipo: 'multipla_escolha',
      enunciado: '',
      opcoes: ['', '', '', ''],
      resposta_correta: '',
      pontuacao: 1
    };

    setQuestoes([...questoes, newQuestion]);
    setExpandedQuestion(questoes.length);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updatedQuestoes = [...questoes];
    updatedQuestoes[index] = { ...updatedQuestoes[index], ...updates };
    setQuestoes(updatedQuestoes);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestoes = questoes.filter((_, i) => i !== index);
    setQuestoes(updatedQuestoes);
    
    if (expandedQuestion === index) {
      setExpandedQuestion(null);
    } else if (expandedQuestion && expandedQuestion > index) {
      setExpandedQuestion(expandedQuestion - 1);
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questoes.length) return;

    const updatedQuestoes = [...questoes];
    [updatedQuestoes[index], updatedQuestoes[newIndex]] = 
    [updatedQuestoes[newIndex], updatedQuestoes[index]];
    
    setQuestoes(updatedQuestoes);
    setExpandedQuestion(newIndex);
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestoes = [...questoes];
    const opcoes = [...(updatedQuestoes[questionIndex].opcoes || [])];
    
    // Se estamos editando a opção que é a resposta correta atual, atualizar também a resposta correta
    const respostaCorretaAtual = updatedQuestoes[questionIndex].resposta_correta;
    const opcaoAnterior = opcoes[optionIndex];
    
    opcoes[optionIndex] = value;
    updatedQuestoes[questionIndex].opcoes = opcoes;
    
    // Sincronizar resposta correta se era a opção que foi editada
    if (respostaCorretaAtual === opcaoAnterior) {
      updatedQuestoes[questionIndex].resposta_correta = value;
    }
    
    setQuestoes(updatedQuestoes);
  };

  const addQuestionOption = (questionIndex: number) => {
    const updatedQuestoes = [...questoes];
    const opcoes = [...(updatedQuestoes[questionIndex].opcoes || [])];
    opcoes.push('');
    updatedQuestoes[questionIndex].opcoes = opcoes;
    setQuestoes(updatedQuestoes);
  };

  const removeQuestionOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestoes = [...questoes];
    const opcoes = [...(updatedQuestoes[questionIndex].opcoes || [])];
    opcoes.splice(optionIndex, 1);
    updatedQuestoes[questionIndex].opcoes = opcoes;
    setQuestoes(updatedQuestoes);
  };

  const getTotalPoints = () => {
    return questoes.reduce((sum, questao) => sum + questao.pontuacao, 0);
  };

  const getQuestionTypeCounts = () => {
    const counts = { verdadeiro_falso: 0, dissertativa: 0, multipla_escolha: 0 };
    questoes.forEach(q => counts[q.tipo]++);
    return counts;
  };

  const questionTypeCounts = getQuestionTypeCounts();

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {model ? 'Editar Modelo de Prova' : 'Novo Modelo de Prova'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Erro</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Modelo *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.nome ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Prova de Conhecimentos Gerais"
                />
                {validationErrors.nome && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.nome}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempo Limite (minutos) *
                </label>
                <input
                  type="number"
                  min="5"
                  value={formData.tempo_limite}
                  onChange={(e) => setFormData({ ...formData, tempo_limite: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.tempo_limite ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.tempo_limite && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.tempo_limite}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.descricao ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Descreva o objetivo e conteúdo desta prova..."
              />
              {validationErrors.descricao && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.descricao}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                Modelo ativo (disponível para aplicação)
              </label>
            </div>

            {/* Questions Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Resumo das Questões</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">{questoes.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">V/F:</span>
                  <span className="font-medium">{questionTypeCounts.verdadeiro_falso}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">Múltipla:</span>
                  <span className="font-medium">{questionTypeCounts.multipla_escolha}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600">Dissertativa:</span>
                  <span className="font-medium">{questionTypeCounts.dissertativa}</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Pontuação Total: </span>
                <span className="text-sm font-medium text-gray-900">{getTotalPoints()} pontos</span>
              </div>
            </div>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Questões ({questoes.length})
                </h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Questão
                </button>
              </div>

              {validationErrors.questoes && (
                <p className="mb-4 text-sm text-red-600">{validationErrors.questoes}</p>
              )}

              <div className="space-y-4">
                {questoes.map((questao, index) => (
                  <QuestionEditor
                    key={questao.id || index}
                    questao={questao}
                    index={index}
                    isExpanded={expandedQuestion === index}
                    onToggle={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                    onUpdate={(updates) => updateQuestion(index, updates)}
                    onRemove={() => removeQuestion(index)}
                    onMoveUp={() => moveQuestion(index, 'up')}
                    onMoveDown={() => moveQuestion(index, 'down')}
                    onUpdateOption={(optionIndex, value) => updateQuestionOption(index, optionIndex, value)}
                    onAddOption={() => addQuestionOption(index)}
                    onRemoveOption={(optionIndex) => removeQuestionOption(index, optionIndex)}
                    canMoveUp={index > 0}
                    canMoveDown={index < questoes.length - 1}
                    validationErrors={validationErrors}
                  />
                ))}
              </div>

              {questoes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma questão adicionada ainda</p>
                  <p className="text-sm">Clique em "Adicionar Questão" para começar</p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Salvando...' : 'Salvar Modelo'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para editar questões
interface QuestionEditorProps {
  questao: Question;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Question>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdateOption: (optionIndex: number, value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (optionIndex: number) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  validationErrors: Record<string, string>;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  questao,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpdateOption,
  onAddOption,
  onRemoveOption,
  canMoveUp,
  canMoveDown,
  validationErrors
}) => {
  const getQuestionTypeLabel = (tipo: QuestionType) => {
    switch (tipo) {
      case 'verdadeiro_falso': return 'Verdadeiro/Falso';
      case 'multipla_escolha': return 'Múltipla Escolha';
      case 'dissertativa': return 'Dissertativa';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Question Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
            <span className="text-sm px-2 py-1 bg-gray-100 rounded">
              {getQuestionTypeLabel(questao.tipo)}
            </span>
            <span className="text-sm text-gray-600">
              {questao.pontuacao} {questao.pontuacao === 1 ? 'ponto' : 'pontos'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              disabled={!canMoveUp}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              disabled={!canMoveDown}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1 text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {questao.enunciado && (
          <p className="mt-2 text-sm text-gray-700 line-clamp-2">
            {questao.enunciado}
          </p>
        )}
      </div>

      {/* Question Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 space-y-4">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Questão
            </label>
            <select
              value={questao.tipo}
              onChange={(e) => onUpdate({ 
                tipo: e.target.value as QuestionType,
                // Reset fields when changing type
                opcoes: e.target.value === 'multipla_escolha' ? ['', '', '', ''] : undefined,
                resposta_correta: e.target.value === 'dissertativa' ? undefined : ''
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="multipla_escolha">Múltipla Escolha</option>
              <option value="verdadeiro_falso">Verdadeiro/Falso</option>
              <option value="dissertativa">Dissertativa</option>
            </select>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enunciado da Questão *
            </label>
            <textarea
              value={questao.enunciado}
              onChange={(e) => onUpdate({ enunciado: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors[`questao_${index}_enunciado`] ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Digite o enunciado da questão..."
            />
            {validationErrors[`questao_${index}_enunciado`] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors[`questao_${index}_enunciado`]}</p>
            )}
          </div>

          {/* Options for Multiple Choice */}
          {questao.tipo === 'multipla_escolha' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opções de Resposta *
              </label>
              <div className="space-y-2">
                {questao.opcoes?.map((opcao, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`questao_${index}_resposta`}
                      checked={questao.resposta_correta === opcao}
                      onChange={() => onUpdate({ resposta_correta: opcao })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <input
                      type="text"
                      value={opcao}
                      onChange={(e) => onUpdateOption(optionIndex, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Opção ${optionIndex + 1}`}
                    />
                    {(questao.opcoes?.length || 0) > 2 && (
                      <button
                        type="button"
                        onClick={() => onRemoveOption(optionIndex)}
                        className="p-2 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={onAddOption}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Opção
                </button>
              </div>
              {validationErrors[`questao_${index}_opcoes`] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors[`questao_${index}_opcoes`]}</p>
              )}
              {validationErrors[`questao_${index}_resposta`] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors[`questao_${index}_resposta`]}</p>
              )}
            </div>
          )}

          {/* True/False Answer */}
          {questao.tipo === 'verdadeiro_falso' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resposta Correta *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`questao_${index}_resposta`}
                    value="verdadeiro"
                    checked={questao.resposta_correta === 'verdadeiro'}
                    onChange={(e) => onUpdate({ resposta_correta: e.target.value })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Verdadeiro</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`questao_${index}_resposta`}
                    value="falso"
                    checked={questao.resposta_correta === 'falso'}
                    onChange={(e) => onUpdate({ resposta_correta: e.target.value })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Falso</span>
                </label>
              </div>
              {validationErrors[`questao_${index}_resposta`] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors[`questao_${index}_resposta`]}</p>
              )}
            </div>
          )}

          {/* Essay Question Note */}
          {questao.tipo === 'dissertativa' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> As questões dissertativas serão corrigidas manualmente 
                pelo recrutador após a submissão da prova.
              </p>
            </div>
          )}

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pontuação *
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={questao.pontuacao}
              onChange={(e) => onUpdate({ pontuacao: parseFloat(e.target.value) || 0 })}
              className={`w-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors[`questao_${index}_pontuacao`] ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors[`questao_${index}_pontuacao`] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors[`questao_${index}_pontuacao`]}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestModelForm;