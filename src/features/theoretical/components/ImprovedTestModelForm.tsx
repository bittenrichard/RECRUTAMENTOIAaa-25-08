// src/features/theoretical/components/ImprovedTestModelForm.tsx

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  ChevronDown, 
  FileText, 
  AlertCircle
} from 'lucide-react';
import { TestModel, Question, QuestionType } from '../../../shared/types';
import { useTheoreticalTests } from '../hooks/useTheoreticalTests';

// ✅ Definir o tipo localmente
type UseTheoreticalTestsReturn = ReturnType<typeof useTheoreticalTests>;

interface ImprovedTestModelFormProps {
  model?: TestModel;
  onSave?: (model: TestModel) => void;
  onCancel?: () => void;
  theoreticalTestsHook?: UseTheoreticalTestsReturn;
}

const ImprovedTestModelForm: React.FC<ImprovedTestModelFormProps> = ({
  model,
  onSave,
  onCancel,
  theoreticalTestsHook
}) => {
  // ✅ Usar o hook passado como prop ou criar uma nova instância
  const defaultHook = useTheoreticalTests();
  const { createModel, updateModel, loading, error, clearError } = theoreticalTestsHook || defaultHook;

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    descricao: '',
    nivel_dificuldade: 'Médio',
    tempo_limite: 30,
    ativo: true
  });

  const [questoes, setQuestoes] = useState<Question[]>([]);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Inicializar formulário com dados do modelo (para edição)
  useEffect(() => {
    if (model) {
      setFormData({
        nome: model.nome,
        categoria: (model as any).categoria || '',
        descricao: model.descricao,
        nivel_dificuldade: (model as any).nivel_dificuldade || 'Médio',
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
    if (!formData.categoria.trim()) {
      errors.categoria = 'Categoria é obrigatória';
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

  const addQuestion = (tipo: QuestionType) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      tipo,
      enunciado: '',
      opcoes: tipo === 'multipla_escolha' ? ['', '', '', ''] : undefined,
      resposta_correta: tipo === 'dissertativa' ? undefined : '',
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

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestoes = [...questoes];
    const opcoes = [...(updatedQuestoes[questionIndex].opcoes || [])];
    opcoes[optionIndex] = value;
    updatedQuestoes[questionIndex].opcoes = opcoes;
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {model ? 'Editar Modelo de Teste' : 'Criar Novo Modelo de Teste'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <X className="w-4 h-4 mr-2 inline" />
              Cancelar
            </button>
            <button
              type="submit"
              form="test-model-form"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2 inline" />
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="test-model-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Informações Básicas */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="Ex: Teste de JavaScript Básico"
                  />
                  {validationErrors.nome && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.nome}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.categoria ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Programação, Marketing, Design"
                  />
                  {validationErrors.categoria && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.categoria}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição do que o teste avalia..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nível de Dificuldade
                  </label>
                  <select
                    value={formData.nivel_dificuldade}
                    onChange={(e) => setFormData({ ...formData, nivel_dificuldade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.ativo ? 'Ativo' : 'Inativo'}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'Ativo' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Questões */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Questões ({questoes.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addQuestion('multipla_escolha')}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Múltipla Escolha
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuestion('verdadeiro_falso')}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    V ou F
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuestion('dissertativa')}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4" />
                    Dissertativa
                  </button>
                </div>
              </div>

              {validationErrors.questoes && (
                <p className="mb-4 text-sm text-red-600">{validationErrors.questoes}</p>
              )}

              <div className="space-y-4">
                {questoes.map((questao, index) => (
                  <ImprovedQuestionEditor
                    key={questao.id || index}
                    questao={questao}
                    index={index}
                    isExpanded={expandedQuestion === index}
                    onToggle={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                    onUpdate={(updates) => updateQuestion(index, updates)}
                    onRemove={() => removeQuestion(index)}
                    onUpdateOption={(optionIndex, value) => updateQuestionOption(index, optionIndex, value)}
                    onAddOption={() => addQuestionOption(index)}
                    onRemoveOption={(optionIndex) => removeQuestionOption(index, optionIndex)}
                    validationErrors={validationErrors}
                  />
                ))}
              </div>

              {questoes.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma questão adicionada</h4>
                  <p className="text-gray-500 mb-4">Comece adicionando questões ao seu teste</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => addQuestion('multipla_escolha')}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Múltipla Escolha
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('verdadeiro_falso')}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" />
                      V ou F
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('dissertativa')}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4" />
                      Dissertativa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente Question Editor melhorado
interface ImprovedQuestionEditorProps {
  questao: Question;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Question>) => void;
  onRemove: () => void;
  onUpdateOption: (optionIndex: number, value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (optionIndex: number) => void;
  validationErrors: Record<string, string>;
}

const ImprovedQuestionEditor: React.FC<ImprovedQuestionEditorProps> = ({
  questao,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onUpdateOption,
  onAddOption,
  onRemoveOption,
  validationErrors
}) => {
  const getQuestionTypeLabel = (tipo: QuestionType) => {
    switch (tipo) {
      case 'verdadeiro_falso': return 'V ou F';
      case 'multipla_escolha': return 'Múltipla Escolha';
      case 'dissertativa': return 'Dissertativa';
    }
  };

  const getQuestionTypeColor = (tipo: QuestionType) => {
    switch (tipo) {
      case 'verdadeiro_falso': return 'bg-green-100 text-green-800';
      case 'multipla_escolha': return 'bg-blue-100 text-blue-800';
      case 'dissertativa': return 'bg-purple-100 text-purple-800';
    }
  };

  const getQuestionTypeIcon = (tipo: QuestionType) => {
    switch (tipo) {
      case 'verdadeiro_falso': return '✓';
      case 'multipla_escolha': return '◉';
      case 'dissertativa': return '📝';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Question Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getQuestionTypeColor(questao.tipo)}`}>
              <span>{getQuestionTypeIcon(questao.tipo)}</span>
              {getQuestionTypeLabel(questao.tipo)}
            </div>
            <span className="text-sm text-gray-600">
              {questao.pontuacao} {questao.pontuacao === 1 ? 'ponto' : 'pontos'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            />
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
        <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50 space-y-4">
          {/* Question Configuration Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={questao.tipo}
                onChange={(e) => onUpdate({ 
                  tipo: e.target.value as QuestionType,
                  opcoes: e.target.value === 'multipla_escolha' ? ['', '', '', ''] : undefined,
                  resposta_correta: e.target.value === 'dissertativa' ? undefined : ''
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="multipla_escolha">Múltipla Escolha</option>
                <option value="verdadeiro_falso">Verdadeiro/Falso</option>
                <option value="dissertativa">Dissertativa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dificuldade
              </label>
              <select
                value={(questao as any).dificuldade || 'Médio'}
                onChange={(e) => onUpdate({ dificuldade: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Fácil">Fácil</option>
                <option value="Médio">Médio</option>
                <option value="Difícil">Difícil</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={questao.pontuacao}
                onChange={(e) => onUpdate({ pontuacao: parseInt(e.target.value) || 1 })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                  validationErrors[`questao_${index}_pontuacao`] ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pergunta *
            </label>
            <textarea
              value={questao.enunciado}
              onChange={(e) => onUpdate({ enunciado: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                validationErrors[`questao_${index}_enunciado`] ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Digite a pergunta..."
            />
            {validationErrors[`questao_${index}_enunciado`] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors[`questao_${index}_enunciado`]}</p>
            )}
          </div>

          {/* Multiple Choice Options */}
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
                    <span className="text-sm font-medium text-gray-700 w-6">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <input
                      type="text"
                      value={opcao}
                      onChange={(e) => onUpdateOption(optionIndex, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder={`Digite a opção ${String.fromCharCode(65 + optionIndex)}...`}
                    />
                    {(questao.opcoes?.length || 0) > 2 && (
                      <button
                        type="button"
                        onClick={() => onRemoveOption(optionIndex)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
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
                    value="Verdadeiro"
                    checked={questao.resposta_correta === 'Verdadeiro'}
                    onChange={(e) => onUpdate({ resposta_correta: e.target.value })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 font-medium">A</span>
                  <span className="ml-2 text-sm text-gray-700">Verdadeiro</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`questao_${index}_resposta`}
                    value="Falso"
                    checked={questao.resposta_correta === 'Falso'}
                    onChange={(e) => onUpdate({ resposta_correta: e.target.value })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 font-medium">B</span>
                  <span className="ml-2 text-sm text-gray-700">Falso</span>
                </label>
              </div>
              {validationErrors[`questao_${index}_resposta`] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors[`questao_${index}_resposta`]}</p>
              )}
            </div>
          )}

          {/* Essay Question */}
          {questao.tipo === 'dissertativa' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resposta Esperada (para correção manual)
              </label>
              <textarea
                value={(questao as any).resposta_esperada || ''}
                onChange={(e) => onUpdate({ resposta_esperada: e.target.value } as any)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Resposta modelo ou critérios de avaliação..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Esta questão será corrigida manualmente pelo recrutador.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImprovedTestModelForm;