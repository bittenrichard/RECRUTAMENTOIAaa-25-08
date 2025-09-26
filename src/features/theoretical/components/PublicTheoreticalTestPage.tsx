// Local: src/features/theoretical/components/PublicTheoreticalTestPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface Question {
  id: string;
  tipo: 'verdadeiro_falso' | 'dissertativa' | 'multipla_escolha';
  enunciado: string;
  opcoes?: string[];
  pontuacao: number;
}

interface TestData {
  id: string;
  candidato_nome: string;
  modelo_prova: {
    nome: string;
    descricao: string;
    questoes: Question[];
  };
  data_inicio: string;
}



interface Props {
  testId?: string;
}

const PublicTheoreticalTestPage: React.FC<Props> = ({ testId: propTestId }) => {
  const { testId: paramTestId } = useParams<{ testId: string }>();
  const testId = propTestId || paramTestId;
  const [step, setStep] = useState(0); // 0: loading, 1: instructions, 2: test, 3: complete, -1: error
  const [error, setError] = useState<string | null>(null);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch test data
  const fetchTestData = useCallback(async () => {
    if (!testId) {
      setError('ID do teste não fornecido.');
      setStep(-1);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/public/theoretical-test/${testId}`);
      if (!response.ok) {
        const data = await response.json();
        // Verificar se a prova já foi respondida
        if (data.already_completed) {
          setError('Esta prova já foi respondida anteriormente e não pode ser feita novamente.');
          setStep(-1);
          return;
        }
        throw new Error(data.error || 'Teste não encontrado ou já finalizado.');
      }
      
      const { data } = await response.json();
      setTestData(data);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStep(-1);
    }
  }, [testId]);

  useEffect(() => {
    fetchTestData();
  }, [fetchTestData]);



  const handleStartTest = () => {
    setStep(2);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitTest = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/theoretical-test/submit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          responses: answers
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao submeter teste.');
      }

      // Não armazenar resultados - candidato não deve ver pontuação
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStep(-1);
    } finally {
      setIsSubmitting(false);
    }
  }, [testId, answers]);



  const renderInstructions = () => {
    if (!testData) return null;

    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <BookOpen size={48} className="mx-auto text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-blue-800 mb-2">{testData.modelo_prova.nome}</h2>
          <p className="text-blue-700">{testData.modelo_prova.descricao}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Instruções do Teste:</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <BookOpen size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Total de questões:</strong> {testData.modelo_prova.questoes.length}
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                Você pode navegar entre as questões e alterar suas respostas até submeter o teste.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                Leia cada questão com atenção e responda de forma clara e objetiva.
              </div>
            </li>
          </ul>
        </div>

        <button
          onClick={handleStartTest}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <BookOpen size={20} />
          Iniciar Teste
        </button>
      </div>
    );
  };

  const renderQuestion = () => {
    if (!testData) return null;

    const question = testData.modelo_prova.questoes[currentQuestionIndex];
    const currentAnswer = answers[question.id] || '';

    return (
      <div className="max-w-4xl mx-auto">
        {/* Header with progress */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex justify-center items-center">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Questão {currentQuestionIndex + 1} de {testData.modelo_prova.questoes.length}
            </span>
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / testData.modelo_prova.questoes.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {question.enunciado}
          </h3>

          {question.tipo === 'verdadeiro_falso' && (
            <div className="space-y-3">
              {['Verdadeiro', 'Falso'].map((option) => (
                <label key={option} className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={option}
                    checked={currentAnswer === option}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.tipo === 'multipla_escolha' && question.opcoes && (
            <div className="space-y-3">
              {question.opcoes.map((option, index) => (
                <label key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={option}
                    checked={currentAnswer === option}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.tipo === 'dissertativa' && (
            <textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Digite sua resposta aqui..."
              className="w-full h-32 p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          <div className="text-sm text-gray-500">
            {Object.keys(answers).length} de {testData.modelo_prova.questoes.length} respondidas
          </div>

          {currentQuestionIndex < testData.modelo_prova.questoes.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Próxima
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmitTest}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Finalizar Teste
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderComplete = () => (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-8">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-green-800 mb-2">Prova Concluída com Sucesso!</h2>
        <p className="text-green-700 mb-6 text-lg">
          Obrigado por completar a prova teórica! Suas respostas foram enviadas com sucesso.
        </p>
        
        <div className="bg-white rounded-lg p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">O que acontece agora?</h3>
          <div className="text-left space-y-2 text-gray-700">
            <p className="flex items-start">
              <CheckCircle size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              Suas respostas foram salvas com segurança
            </p>
            <p className="flex items-start">
              <CheckCircle size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              O recrutador foi notificado sobre a conclusão
            </p>
            <p className="flex items-start">
              <CheckCircle size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              Em breve entraremos em contato com o resultado
            </p>
          </div>
        </div>
        
        <p className="text-sm text-green-600 mt-6 font-medium">
          Esta prova não pode ser respondida novamente. Aguarde o contato do recrutador.
        </p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8">
        <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-800 mb-2">Erro</h2>
        <p className="text-red-700">{error}</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center py-20">
            <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
            <h3 className="mt-4 text-xl font-semibold text-gray-800">Carregando teste...</h3>
          </div>
        );
      case 1:
        return renderInstructions();
      case 2:
        return renderQuestion();
      case 3:
        return renderComplete();
      case -1:
        return renderError();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Prova Teórica</h1>
          {testData && step > 0 && step < 3 && (
            <p className="text-gray-600 mt-2">Olá, {testData.candidato_nome}! Siga as instruções abaixo.</p>
          )}
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default PublicTheoreticalTestPage;