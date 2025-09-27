import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, User, Award, BookOpen } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface Question {
  id: number;
  pergunta: string;
  enunciado?: string;
  opcoes: string[];
  resposta_correta: string;
  tipo: 'multipla_escolha' | 'verdadeiro_falso' | 'dissertativa';
  pontuacao?: number;
}

interface CandidateAnswer {
  question_id: number;
  answer: string;
}

interface GabaritoData {
  test: {
    id: number;
    candidato_nome: string;
    modelo_nome: string;
    pontuacao_total: number;
    total_questoes: number;
    acertos: number;
    status: string;
    data_finalizacao: string;
  };
  questions: Question[];
  candidateAnswers: CandidateAnswer[];
}

interface GabaritoReviewPageProps {
  testId: string;
}

const GabaritoReviewPage: React.FC<GabaritoReviewPageProps> = ({ testId }) => {
  const [gabaritoData, setGabaritoData] = useState<GabaritoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGabarito = async () => {
      console.log('[GabaritoReviewPage] testId recebido:', testId);
      console.log('[GabaritoReviewPage] typeof testId:', typeof testId);
      
      if (!testId) {
        console.error('[GabaritoReviewPage] ID do teste não fornecido');
        setError('ID do teste não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const url = `${API_BASE_URL}/api/theoretical-test/review/${testId}`;
        console.log('[GabaritoReviewPage] Fazendo requisição para:', url);
        
        const response = await fetch(url);
        console.log('[GabaritoReviewPage] Response status:', response.status);
        
        const data = await response.json();
        console.log('[GabaritoReviewPage] Response data:', data);

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Erro ao carregar gabarito');
        }

        setGabaritoData(data.data);
      } catch (err) {
        console.error('Erro ao carregar gabarito:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    loadGabarito();
  }, [testId]);

  const isCorrect = (question: Question, candidateAnswer: CandidateAnswer | undefined) => {
    if (!candidateAnswer) return false;
    return candidateAnswer.answer === question.resposta_correta;
  };

  const getCandidateAnswerForQuestion = (questionId: number) => {
    return gabaritoData?.candidateAnswers.find(answer => answer.question_id === questionId);
  };

  const getPercentage = () => {
    if (!gabaritoData) return 0;
    return Math.round((gabaritoData.test.acertos / gabaritoData.test.total_questoes) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando gabarito...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao carregar gabarito</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!gabaritoData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Nenhum dado encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Voltar
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gabarito da Prova Teórica</h1>
                <p className="text-sm text-gray-600">{gabaritoData.test.modelo_nome}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Resultado</div>
              <div className={`text-lg font-bold ${getPercentage() >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                {getPercentage()}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informações do Candidato */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Candidato</p>
                <p className="font-semibold text-gray-900">{gabaritoData.test.candidato_nome}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Award size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pontuação</p>
                <p className="font-semibold text-gray-900">{gabaritoData.test.pontuacao_total}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <BookOpen size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Acertos</p>
                <p className="font-semibold text-gray-900">
                  {gabaritoData.test.acertos}/{gabaritoData.test.total_questoes}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <Clock size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Finalizada em</p>
                <p className="font-semibold text-gray-900">
                  {new Date(gabaritoData.test.data_finalizacao).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Questões e Respostas */}
        <div className="space-y-6">
          {gabaritoData.questions.map((question, index) => {
            const candidateAnswer = getCandidateAnswerForQuestion(question.id);
            const correct = isCorrect(question, candidateAnswer);

            return (
              <div key={question.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header da Questão */}
                <div className={`px-6 py-4 ${correct ? 'bg-green-50 border-b-2 border-green-200' : 'bg-red-50 border-b-2 border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="bg-white text-gray-700 px-3 py-1 rounded-full text-sm font-semibold border">
                        Questão {index + 1}
                      </span>
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                        correct 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        <span className="text-sm font-semibold">
                          {correct ? 'ACERTOU' : 'ERROU'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Pontos: {question.pontuacao || 1}
                    </div>
                  </div>
                </div>

                {/* Conteúdo da Questão */}
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
                    {question.enunciado || question.pergunta}
                  </h3>

                  {/* Alternativas - Múltipla Escolha */}
                  {question.tipo === 'multipla_escolha' && question.opcoes && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
                        Alternativas:
                      </h4>
                      {question.opcoes.map((opcao, opcaoIndex) => {
                        const isCorrectAnswer = opcao === question.resposta_correta;
                        const isSelectedAnswer = candidateAnswer?.answer === opcao;
                        
                        let cardStyle = '';
                        let badgeStyle = '';
                        let badgeText = '';
                        let icon = null;
                        
                        if (isCorrectAnswer && isSelectedAnswer) {
                          // Acertou
                          cardStyle = 'border-2 border-green-500 bg-green-50';
                          badgeStyle = 'bg-green-100 text-green-800 border border-green-300';
                          badgeText = 'RESPOSTA CORRETA ✓';
                          icon = <CheckCircle size={18} className="text-green-600" />;
                        } else if (isCorrectAnswer && !isSelectedAnswer) {
                          // Resposta correta não selecionada
                          cardStyle = 'border-2 border-green-500 bg-green-50';
                          badgeStyle = 'bg-green-100 text-green-800 border border-green-300';
                          badgeText = 'RESPOSTA CORRETA';
                          icon = <CheckCircle size={18} className="text-green-600" />;
                        } else if (!isCorrectAnswer && isSelectedAnswer) {
                          // Errou - selecionou incorreta
                          cardStyle = 'border-2 border-red-500 bg-red-50';
                          badgeStyle = 'bg-red-100 text-red-800 border border-red-300';
                          badgeText = 'RESPOSTA ESCOLHIDA ✗';
                          icon = <XCircle size={18} className="text-red-600" />;
                        } else {
                          // Opção neutra
                          cardStyle = 'border border-gray-200 bg-white';
                        }
                        
                        return (
                          <div key={opcaoIndex} className={`p-4 rounded-lg ${cardStyle} transition-all`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1">
                                <span className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                                  {String.fromCharCode(65 + opcaoIndex)}
                                </span>
                                <span className="text-gray-900 font-medium">{opcao}</span>
                              </div>
                              {(isCorrectAnswer || isSelectedAnswer) && (
                                <div className="flex items-center space-x-2">
                                  {icon}
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${badgeStyle}`}>
                                    {badgeText}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Verdadeiro/Falso */}
                  {question.tipo === 'verdadeiro_falso' && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
                        Alternativas:
                      </h4>
                      {['Verdadeiro', 'Falso'].map((opcao, opcaoIndex) => {
                        const isCorrectAnswer = opcao === question.resposta_correta;
                        const isSelectedAnswer = candidateAnswer?.answer === opcao;
                        
                        let cardStyle = '';
                        let badgeStyle = '';
                        let badgeText = '';
                        let icon = null;
                        
                        if (isCorrectAnswer && isSelectedAnswer) {
                          cardStyle = 'border-2 border-green-500 bg-green-50';
                          badgeStyle = 'bg-green-100 text-green-800 border border-green-300';
                          badgeText = 'RESPOSTA CORRETA ✓';
                          icon = <CheckCircle size={18} className="text-green-600" />;
                        } else if (isCorrectAnswer && !isSelectedAnswer) {
                          cardStyle = 'border-2 border-green-500 bg-green-50';
                          badgeStyle = 'bg-green-100 text-green-800 border border-green-300';
                          badgeText = 'RESPOSTA CORRETA';
                          icon = <CheckCircle size={18} className="text-green-600" />;
                        } else if (!isCorrectAnswer && isSelectedAnswer) {
                          cardStyle = 'border-2 border-red-500 bg-red-50';
                          badgeStyle = 'bg-red-100 text-red-800 border border-red-300';
                          badgeText = 'RESPOSTA ESCOLHIDA ✗';
                          icon = <XCircle size={18} className="text-red-600" />;
                        } else {
                          cardStyle = 'border border-gray-200 bg-white';
                        }
                        
                        return (
                          <div key={opcaoIndex} className={`p-4 rounded-lg ${cardStyle} transition-all`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1 rounded text-sm font-semibold ${
                                  opcao === 'Verdadeiro' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {opcao}
                                </span>
                              </div>
                              {(isCorrectAnswer || isSelectedAnswer) && (
                                <div className="flex items-center space-x-2">
                                  {icon}
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${badgeStyle}`}>
                                    {badgeText}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Questão Dissertativa */}
                  {question.tipo === 'dissertativa' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                          Resposta do Candidato:
                        </h4>
                        <div className="bg-white p-3 rounded border text-gray-900 whitespace-pre-wrap">
                          {candidateAnswer?.answer || 'Não respondida'}
                        </div>
                      </div>
                      {question.resposta_correta && (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                          <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                            <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                            Resposta Esperada:
                          </h4>
                          <div className="bg-white p-3 rounded border text-gray-900 whitespace-pre-wrap">
                            {question.resposta_correta}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumo Final */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo da Avaliação</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{gabaritoData.test.total_questoes}</div>
              <div className="text-sm text-gray-600">Total de Questões</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{gabaritoData.test.acertos}</div>
              <div className="text-sm text-gray-600">Acertos</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{getPercentage()}%</div>
              <div className="text-sm text-gray-600">Aproveitamento</div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              getPercentage() >= 70 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {getPercentage() >= 70 ? (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  Candidato Aprovado
                </>
              ) : (
                <>
                  <XCircle size={16} className="mr-2" />
                  Candidato Reprovado
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GabaritoReviewPage;