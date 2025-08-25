// CÓDIGO COMPLETO DO ARQUIVO
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { Loader2, Eye, ClipboardCheck, Clock, AlertTriangle } from 'lucide-react';
import { BehavioralTestResult } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
interface BehavioralTestsListPageProps { onViewResult: (testId: number) => void; }
const getStatusChip = (status: string) => { switch (status) { case 'Concluído': return <div className="inline-flex items-center gap-2 text-xs font-semibold bg-green-100 text-green-800 px-3 py-1 rounded-full"><ClipboardCheck size={14}/> {status}</div>; case 'Processando': return <div className="inline-flex items-center gap-2 text-xs font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full"><Loader2 size={14} className="animate-spin"/> {status}</div>; case 'Pendente': return <div className="inline-flex items-center gap-2 text-xs font-semibold bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full"><Clock size={14}/> {status}</div>; default: return <div className="inline-flex items-center gap-2 text-xs font-semibold bg-gray-100 text-gray-800 px-3 py-1 rounded-full">{status}</div>; } };
const BehavioralTestsListPage: React.FC<BehavioralTestsListPageProps> = ({ onViewResult }) => {
    const { profile } = useAuth();
    const [results, setResults] = useState<BehavioralTestResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fetchResults = useCallback(async () => { if (!profile) return; setIsLoading(true); setError(null); try { const response = await fetch(`${API_BASE_URL}/api/behavioral-test/results/recruiter/${profile.id}`); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.error || 'Falha ao buscar resultados.'); setResults(data.data); } catch (err: any) { setError(err.message); } finally { setIsLoading(false); } }, [profile]);
    useEffect(() => { fetchResults(); }, [fetchResults]);
    if (isLoading) { return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>; }
    if (error) { return <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center gap-2"><AlertTriangle size={20} /> {error}</div>; }
    return (<div className="fade-in bg-white p-8 rounded-lg shadow-md border border-gray-200"><h1 className="text-3xl font-bold text-gray-900 mb-2">Resultados dos Testes</h1><p className="text-gray-600 mb-8">Acompanhe o status e visualize os perfis comportamentais dos seus candidatos.</p><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-xs text-gray-500 uppercase border-b bg-gray-50"><th className="px-4 py-3 font-semibold">Candidato</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Data da Resposta</th><th className="px-4 py-3 font-semibold text-center">Ações</th></tr></thead><tbody>{results.length > 0 ? (results.map((result) => (<tr key={result.id} className="border-b hover:bg-gray-50 transition-colors"><td className="px-4 py-4 font-medium text-gray-800">{result.candidato[0]?.value || 'N/A'}</td><td className="px-4 py-4">{getStatusChip(result.status)}</td><td className="px-4 py-4 text-gray-600">{result.data_de_resposta ? format(new Date(result.data_de_resposta), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não respondido'}</td><td className="px-4 py-4 text-center"><button onClick={() => onViewResult(result.id)} disabled={result.status !== 'Concluído'} className="p-2 text-gray-500 rounded-full transition-colors disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-200 hover:text-indigo-600" title="Ver Resultado"><Eye size={18} /></button></td></tr>))) : (<tr><td colSpan={4} className="text-center py-10 text-gray-500">Nenhum teste comportamental foi gerado ou respondido ainda.</td></tr>)}</tbody></table></div></div>);
};
export default BehavioralTestsListPage;