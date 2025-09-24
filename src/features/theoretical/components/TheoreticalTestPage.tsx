// Local: src/features/theoretical/components/TheoreticalTestPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  AlertCircle,
  Send,
  FileText
} from 'lucide-react';
import { CandidateTestData, TestSubmission } from '../../../shared/types';
import { useTheoreticalTests } from '../hooks/useTheoreticalTests';

interface TheoreticalTestPageProps {
  candidateId: string;
  onTestCompleted?: (score: number) => void;
  onTestNotFound?: () => void;
}

const TheoreticalTestPage: React.FC<TheoreticalTestPageProps> = ({
  candidateId,
  onTestCompleted,
  onTestNotFound
}) => {
  const { getCandidateTest, submitTest, loading, error, clearError } = useTheoreticalTests();

  // Estados principais
  const [testData, setTestData] = useState<CandidateTestData | null>(null);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Carregar teste do candidato
  useEffect(() => {
    const loadTest = async () => {
      try {
        const test = await getCandidateTest(candidateId);
        if (!test) {
          onTestNotFound?.();
          return;
        }
        
        setTestData(test);
        setTempoRestante(test.tempo_restante * 60); // converter para segundos
        
        // Carregar respostas existentes
        const respostasExistentes: Record<string, string> = {};
        test.questoes.forEach(questao => {
          if (questao.resposta_candidato) {
            respostasExistentes[questao.id!] = questao.resposta_candidato;
          }
        });
        setRespostas(respostasExistentes);
      } catch (error) {
        // Erro já tratado pelo hook
      }
    };

    loadTest();
  }, [candidateId, getCandidateTest, onTestNotFound]);

  // Timer countdown
  useEffect(() => {
    if (!testData || tempoRestante <= 0) return;

    const timer = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          // Tempo esgotado - submeter automaticamente
          handleSubmitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testData, tempoRestante]);

  // Limpar erros
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResposta = (questaoId: string, resposta: string) => {
    setRespostas(prev => ({
      ...prev,
      [questaoId]: resposta
    }));
  };

  const getQuestoesRespondidas = (): number => {
    return Object.keys(respostas).filter(questaoId => 
      respostas[questaoId] && respostas[questaoId].trim().length > 0
    ).length;
  };

  const navegarQuestao = (direction: 'prev' | 'next') => {
    if (!testData) return;

    if (direction === 'prev' && questaoAtual > 0) {
      setQuestaoAtual(questaoAtual - 1);
    } else if (direction === 'next' && questaoAtual < testData.questoes.length - 1) {
      setQuestaoAtual(questaoAtual + 1);
    }
  };

  const handleSubmitTest = useCallback(async (forceSubmit = false) => {
    if (!testData || isSubmitting) return;

    if (!forceSubmit) {
      setShowConfirmSubmit(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const submission: TestSubmission = {
        respostas: Object.entries(respostas).map(([questao_id, resposta]) => ({
          questao_id,
          resposta
        }))
      };

      const result = await submitTest(testData.id, submission);
      onTestCompleted?.(result.pontuacao_total);
    } catch (error) {
      // Erro já tratado pelo hook
    } finally {
      setIsSubmitting(false);
      setShowConfirmSubmit(false);
    }
  }, [testData, isSubmitting, respostas, submitTest, onTestCompleted]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando prova...</p>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma prova encontrada
          </h2>
          <p className="text-gray-600">
            Não há nenhuma prova em andamento para este candidato.
          </p>
        </div>
      </div>
    );
  }

  const questaoAtualData = testData.questoes[questaoAtual];
  const questoesRespondidas = getQuestoesRespondidas();
  const isTempoEsgotando = tempoRestante <= 300; // 5 minutos

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {testData.modelo_nome}
              </h1>
              <p className="text-sm text-gray-600">
                Questão {questaoAtual + 1} de {testData.questoes.length}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Progress */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-gray-600">Progresso:</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${(questoesRespondidas / testData.questoes.length) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {questoesRespondidas}/{testData.questoes.length}
                </span>
              </div>

              {/* Timer */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isTempoEsgotando 
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium">
                  {formatTime(tempoRestante)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning para tempo esgotando */}
      {isTempoEsgotando && (
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Restam menos de 5 minutos para finalizar a prova!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Question Content */}
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                  {questaoAtual + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {questaoAtualData.tipo === 'verdadeiro_falso' && 'Verdadeiro/Falso'}
                      {questaoAtualData.tipo === 'multipla_escolha' && 'Múltipla Escolha'}
                      {questaoAtualData.tipo === 'dissertativa' && 'Dissertativa'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {questaoAtualData.pontuacao} {questaoAtualData.pontuacao === 1 ? 'ponto' : 'pontos'}
                    </span>
                  </div>
                  <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
                    {questaoAtualData.enunciado}
                  </h2>
                </div>
              </div>

              {/* Question Input */}
              <div className="ml-11">
                {questaoAtualData.tipo === 'verdadeiro_falso' && (
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`questao_${questaoAtual}`}
                        value="verdadeiro"
                        checked={respostas[questaoAtualData.id!] === 'verdadeiro'}
                        onChange={(e) => handleResposta(questaoAtualData.id!, e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-gray-900">Verdadeiro</span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`questao_${questaoAtual}`}
                        value="falso"
                        checked={respostas[questaoAtualData.id!] === 'falso'}
                        onChange={(e) => handleResposta(questaoAtualData.id!, e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-gray-900">Falso</span>
                    </label>
                  </div>
                )}

                {questaoAtualData.tipo === 'multipla_escolha' && (
                  <div className="space-y-3">
                    {questaoAtualData.opcoes?.map((opcao, index) => (
                      <label 
                        key={index}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`questao_${questaoAtual}`}
                          value={opcao}
                          checked={respostas[questaoAtualData.id!] === opcao}
                          onChange={(e) => handleResposta(questaoAtualData.id!, e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-3 text-gray-900">{opcao}</span>
                      </label>
                    ))}
                  </div>
                )}

                {questaoAtualData.tipo === 'dissertativa' && (
                  <div>
                    <textarea
                      value={respostas[questaoAtualData.id!] || ''}
                      onChange={(e) => handleResposta(questaoAtualData.id!, e.target.value)}
                      rows={6}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Digite sua resposta aqui..."
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Seja claro e objetivo em sua resposta. Esta questão será avaliada manualmente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navegarQuestao('prev')}
                disabled={questaoAtual === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <div className="flex items-center gap-4">
                {/* Question indicators */}
                <div className="hidden sm:flex items-center gap-1">
                  {testData.questoes.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setQuestaoAtual(index)}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        index === questaoAtual
                          ? 'bg-blue-600 text-white'
                          : respostas[testData.questoes[index].id!]
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                {/* Submit button */}
                <button
                  onClick={() => handleSubmitTest()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  disabled={isSubmitting}
                >
                  <Flag className="w-4 h-4" />
                  Finalizar Prova
                </button>
              </div>

              <button
                onClick={() => navegarQuestao('next')}
                disabled={questaoAtual === testData.questoes.length - 1}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Confirmar Finalização
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Tem certeza que deseja finalizar a prova? Após a finalização, 
                não será possível alterar as respostas.
              </p>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Questões respondidas:</span>
                    <span className="font-medium text-gray-900">
                      {questoesRespondidas} de {testData.questoes.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tempo restante:</span>
                    <span className="font-medium text-gray-900">
                      {formatTime(tempoRestante)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Continuar Prova
              </button>
              <button
                onClick={() => handleSubmitTest(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSubmitting ? 'Enviando...' : 'Finalizar Prova'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TheoreticalTestPage;