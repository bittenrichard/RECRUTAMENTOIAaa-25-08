import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, User, Award, BookOpen } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface Question {
  id: number;
  pergunta: string;
  opcoes: string[];
  resposta_correta: number;
  tipo: 'multipla_escolha' | 'verdadeiro_falso';
}

interface CandidateAnswer {
  questao_id: number;
  resposta_selecionada: number;
  tempo_resposta?: number;
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

const GabaritoReviewPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [gabaritoData, setGabaritoData] = useState<GabaritoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGabarito = async () => {
      if (!testId) {
        setError('ID do teste não fornecido');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/theoretical-test/review/${testId}`);
        const data = await response.json();

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
    return candidateAnswer.resposta_selecionada === question.resposta_correta;
  };

  const getPercentage = () => {
    if (!gabaritoData) return 0;
    return Math.round((gabaritoData.test.acertos / gabaritoData.test.total_questoes) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando gabarito...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao Carregar Gabarito</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.close()} 
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (!gabaritoData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Nenhum dado encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => window.close()}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={24} />
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
            const candidateAnswer = gabaritoData.candidateAnswers.find(
              answer => answer.questao_id === question.id
            );
            const correct = isCorrect(question, candidateAnswer);

            return (
              <div key={question.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                        Questão {index + 1}
                      </span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        correct 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {correct ? 'Correto' : 'Incorreto'}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{question.pergunta}</h3>
                  </div>
                  <div className={`ml-4 ${correct ? 'text-green-500' : 'text-red-500'}`}>
                    {correct ? <CheckCircle size={24} /> : <XCircle size={24} />}
                  </div>
                </div>

                <div className="space-y-2">
                  {question.tipo === 'multipla_escolha' ? (
                    question.opcoes.map((opcao, opcaoIndex) => {
                      const isCorrectAnswer = opcaoIndex === question.resposta_correta;
                      const isSelectedAnswer = candidateAnswer?.resposta_selecionada === opcaoIndex;
                      
                      return (
                        <div
                          key={opcaoIndex}
                          className={`p-3 rounded-lg border-2 ${
                            isCorrectAnswer
                              ? 'border-green-500 bg-green-50'
                              : isSelectedAnswer && !isCorrectAnswer
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900">{opcao}</span>
                            <div className="flex items-center space-x-2">
                              {isCorrectAnswer && (
                                <span className="text-green-600 text-sm font-medium">Resposta Correta</span>
                              )}
                              {isSelectedAnswer && !isCorrectAnswer && (
                                <span className="text-red-600 text-sm font-medium">Resposta do Candidato</span>
                              )}
                              {isSelectedAnswer && isCorrectAnswer && (
                                <span className="text-green-600 text-sm font-medium">Selecionada (Correta)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Verdadeiro/Falso
                    <div className="space-y-2">
                      {[0, 1].map(opcaoIndex => {
                        const opcaoTexto = opcaoIndex === 0 ? 'Verdadeiro' : 'Falso';
                        const isCorrectAnswer = opcaoIndex === question.resposta_correta;
                        const isSelectedAnswer = candidateAnswer?.resposta_selecionada === opcaoIndex;
                        
                        return (
                          <div
                            key={opcaoIndex}
                            className={`p-3 rounded-lg border-2 ${
                              isCorrectAnswer
                                ? 'border-green-500 bg-green-50'
                                : isSelectedAnswer && !isCorrectAnswer
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-900 font-medium">{opcaoTexto}</span>
                              <div className="flex items-center space-x-2">
                                {isCorrectAnswer && (
                                  <span className="text-green-600 text-sm font-medium">Resposta Correta</span>
                                )}
                                {isSelectedAnswer && !isCorrectAnswer && (
                                  <span className="text-red-600 text-sm font-medium">Resposta do Candidato</span>
                                )}
                                {isSelectedAnswer && isCorrectAnswer && (
                                  <span className="text-green-600 text-sm font-medium">Selecionada (Correta)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {candidateAnswer?.tempo_resposta && (
                  <div className="mt-4 text-sm text-gray-500">
                    <Clock size={14} className="inline mr-1" />
                    Tempo de resposta: {candidateAnswer.tempo_resposta}s
                  </div>
                )}
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