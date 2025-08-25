// Local: src/features/behavioral/components/PublicTestPage.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ADJECTIVES_STEP_1, ADJECTIVES_STEP_2 } from '../data/questions';
import { Loader2, AlertCircle, CheckCircle, BrainCircuit, Calendar } from 'lucide-react';
import ProgressBar from '../../../shared/components/Layout/ProgressBar/index';
import { BehavioralTestResult } from '../types';
import ProfileChart from './ProfileChart';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface PublicTestPageProps {
  testId: string;
}

const AdjectiveButton: React.FC<{
  adjective: string, isSelected: boolean, isDisabled: boolean, onClick: () => void
}> = ({ adjective, isSelected, isDisabled, onClick }) => (
    <button type="button" onClick={onClick} disabled={isDisabled && !isSelected}
        className={`px-4 py-2 border rounded-md text-sm font-medium transition-all duration-200 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'} ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {adjective}
    </button>
);

const PublicTestPage: React.FC<PublicTestPageProps> = ({ testId }) => {
    const [step, setStep] = useState(0); // 0: Loading, 1: Step 1, 2: Step 2, 3: Submitting, 4: Showing results
    const [step1Answers, setStep1Answers] = useState<string[]>([]);
    const [step2Answers, setStep2Answers] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [candidateName, setCandidateName] = useState<string>('');
    const [finalResult, setFinalResult] = useState<BehavioralTestResult | null>(null);
    
    const pageTopRef = useRef<HTMLDivElement>(null);
    const SELECTIONS_MINIMUM = 10;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const fetchTestData = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/public/behavioral-test/${testId}`);
            if (!response.ok) throw new Error('Teste inválido, já respondido ou não encontrado.');
            const { data } = await response.json();
            setCandidateName(data.candidateName);
            setStep(1);
        } catch (err: any) {
            setError(err.message);
            setStep(-1);
        }
    }, [testId]);
    
    useEffect(() => {
        fetchTestData();
    }, [fetchTestData]);

    const currentAnswers = step === 1 ? step1Answers : step2Answers;
    const setAnswers = step === 1 ? setStep1Answers : setStep2Answers;
    const adjectives = step === 1 ? ADJECTIVES_STEP_1 : ADJECTIVES_STEP_2;

    const handleSelect = (adjective: string) => {
        setAnswers(prev => prev.includes(adjective) ? prev.filter(a => a !== adjective) : [...prev, adjective]);
    };

    const handleNextStep = () => {
        if (currentAnswers.length < SELECTIONS_MINIMUM) {
            alert(`Você deve selecionar no mínimo ${SELECTIONS_MINIMUM} adjetivos.`);
            return;
        }
        setStep(2);
    };

    const handleSubmit = async () => {
        if (step2Answers.length < SELECTIONS_MINIMUM) {
            alert(`Você deve selecionar no mínimo ${SELECTIONS_MINIMUM} adjetivos no Passo 2.`);
            return;
        }
        setStep(3);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/behavioral-test/submit`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testId, responses: { step1: step1Answers, step2: step2Answers } }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Falha ao processar o teste. Tente novamente mais tarde.');
            }
            
            setFinalResult(result.data);
            setStep(4);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setStep(-1);
        }
    };

    const renderContent = () => {
        switch (step) {
            case 0:
                return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;
            case 1:
            case 2:
                const progress = step === 1 
                    ? Math.min(50, (currentAnswers.length / SELECTIONS_MINIMUM) * 50) 
                    : 50 + Math.min(50, (currentAnswers.length / SELECTIONS_MINIMUM) * 50);
                return (
                    <>
                        <p className="text-center text-gray-600 mt-2">Passo {step} de 2</p>
                        <div className="my-6"><ProgressBar progress={progress} /></div>
                        <div className="fade-in" key={step}>
                            <div className="bg-gray-50 p-6 rounded-lg border">
                                <h2 className="text-lg font-semibold text-gray-900">{step === 1 ? 'Como os outros te veem?' : 'Como você se vê?'}</h2>
                                <p className="text-sm text-gray-600 mt-1">{step === 1 ? 'Na sua percepção, marque os adjetivos que descrevem como os outros pensam que você deveria ser.' : 'Agora, marque os adjetivos que melhor te representam.'}</p>
                                <p className="mt-4 font-bold text-indigo-700">Selecione no mínimo {SELECTIONS_MINIMUM} opções. ({currentAnswers.length} selecionadas)</p>
                            </div>
                            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {adjectives.map(adj => <AdjectiveButton key={adj} adjective={adj} isSelected={currentAnswers.includes(adj)} isDisabled={false} onClick={() => handleSelect(adj)} />)}
                            </div>
                        </div>
                        <div className="mt-10 flex justify-end items-center">
                            {step === 1 ? (
                                <button onClick={handleNextStep} disabled={currentAnswers.length < SELECTIONS_MINIMUM} className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50">Próximo Passo</button>
                            ) : (
                                <button onClick={handleSubmit} disabled={currentAnswers.length < SELECTIONS_MINIMUM} className="px-8 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors disabled:opacity-50">Finalizar Teste</button>
                            )}
                        </div>
                    </>
                );
            case 3:
                return (
                    <div className="text-center py-20">
                        <Loader2 className="mx-auto h-12 w-12 text-indigo-600 animate-spin" />
                        <h3 className="mt-4 text-2xl font-semibold text-gray-800">Analisando suas respostas...</h3>
                        <p className="mt-2 text-gray-600">Isso pode levar até 2 minutos. Por favor, não feche esta janela.</p>
                    </div>
                );
            case 4:
                if (!finalResult) return null;
                const chartData = { executor: finalResult.perfil_executor || 0, comunicador: finalResult.perfil_comunicador || 0, planejador: finalResult.perfil_planejador || 0, analista: finalResult.perfil_analista || 0, };
                return (
                    <div className="fade-in max-w-5xl mx-auto space-y-8">
                        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                          <div className="flex flex-col sm:flex-row justify-between items-start">
                              <div>
                                  <h1 className="text-3xl font-bold text-gray-900">{finalResult.candidato[0]?.value || 'Candidato'}</h1>
                                  <div className="flex items-center text-gray-500 mt-2">
                                      <Calendar size={16} className="mr-2" />
                                      <span>Teste respondido em: {format(new Date(finalResult.data_de_resposta), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                                  </div>
                              </div>
                              <div className="mt-4 sm:mt-0 flex items-center gap-2 text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-full">
                                  <CheckCircle size={20} />
                                  <span>Análise Concluída</span>
                              </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><BrainCircuit size={20} className="mr-2 text-indigo-600"/> Resumo do Perfil</h3>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{finalResult.resumo_perfil || 'Nenhum resumo gerado.'}</p>
                                </div>
                            </div>
                            <div className="lg:col-span-1">
                                <ProfileChart data={chartData} />
                            </div>
                        </div>
                        <div className="text-center mt-8 p-4 bg-gray-50 rounded-lg">
                           <p className="text-gray-700">Obrigado por completar o teste! O recrutador entrará em contato em breve. Você já pode fechar esta janela.</p>
                        </div>
                    </div>
                );
            case -1:
            default:
                return <div className="min-h-[50vh] flex items-center justify-center bg-red-50 p-8 rounded-lg"><AlertCircle className="text-red-500 mr-4" size={48} /><p className="text-red-700 text-xl">{error}</p></div>;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8" ref={pageTopRef}>
            <div className="max-w-4xl w-full mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 text-center">Teste de Perfil Comportamental</h1>
                {step > 0 && step < 3 && <p className="text-center text-gray-600 mt-2">Olá, {candidateName}! Siga as instruções abaixo.</p>}
                {renderContent()}
            </div>
        </div>
    );
};

export default PublicTestPage;