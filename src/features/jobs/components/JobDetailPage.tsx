// src/features/jobs/components/JobDetailPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AutoMatchPopup } from './AutoMatchPopup';
import { useAuth } from '../../auth/hooks/useAuth';
import { Briefcase, MapPin, Building2, FileText, Sparkles, Loader2 } from 'lucide-react';

interface JobData {
  id: number;
  cargo?: string;
  titulo?: string;
  empresa: string;
  localizacao?: string;
  endereco?: string;
  descricao: string;
  requisitos_json?: string;
  requisitos_obrigatorios?: string;
  requisitos_desejaveis?: string;
  modo_trabalho?: string;
  created_at?: string;
}

interface AutoMatchResults {
  totalCandidatesAnalyzed: number;
  matchesFound: number;
  matches: Array<{
    candidateId: number;
    candidateName: string;
    candidatePhone?: string;
    candidateLocation?: string;
    compatibilityScore: number;
    matchReasons: string[];
    suggestedActions: string[];
    riskFactors: string[];
    fitAnalysis?: {
      technical: number;
      cultural: number;
      experience: number;
      location: number;
      salary: number;
    };
    detailedAnalysis?: string;
  }>;
  timeSavedHours: number;
  executionTime: number;
}

const JobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAutoMatchPopup, setShowAutoMatchPopup] = useState(false);
  const [autoMatchResults, setAutoMatchResults] = useState<AutoMatchResults | null>(null);
  const [executingAutoMatch, setExecutingAutoMatch] = useState(false);
  const [autoMatchAttempted, setAutoMatchAttempted] = useState(false); // Flag para evitar loop

  const executeAutoMatch = useCallback(async () => {
    if (!profile || !jobId || autoMatchAttempted) return;
    
    setAutoMatchAttempted(true); // Marcar que já tentou
    setExecutingAutoMatch(true);
    try {
      console.log('🤖 Executando Auto-Match para vaga', jobId);
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/auto-match/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: parseInt(jobId),
          userId: profile.id 
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const results = await response.json();
      
      if (results.success) {
        setAutoMatchResults(results.data);
        setShowAutoMatchPopup(true);
      } else {
        console.error('Auto-match falhou:', results.error);
      }
      
    } catch (error) {
      console.error('Erro no auto-match:', error);
    } finally {
      setExecutingAutoMatch(false);
    }
  }, [profile, jobId, autoMatchAttempted]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);
        
        if (response.ok) {
          const jobData = await response.json();
          setJob(jobData);
        }
      } catch (error) {
        console.error('Erro ao carregar vaga:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [jobId]);

  useEffect(() => {
    // Verificar se deve executar auto-match (apenas uma vez)
    const shouldAutoMatch = searchParams.get('autoMatch') === 'true';
    if (shouldAutoMatch && job && !autoMatchAttempted) {
      executeAutoMatch();
    }
  }, [searchParams, job, autoMatchAttempted, executeAutoMatch]);

  const handleContactCandidate = async (candidateId: number) => {
    try {
      console.log('📞 Contatar candidato:', candidateId);
      // Implementar lógica de contato via WhatsApp
    } catch (error) {
      console.error('Erro ao contatar candidato:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando vaga...</p>
          {executingAutoMatch && (
            <p className="text-indigo-600 mt-2 font-medium">🤖 Analisando candidatos com IA...</p>
          )}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Vaga não encontrada</h2>
          <p className="text-gray-600">A vaga que você está procurando não existe ou foi removida.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header da Vaga */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="h-8 w-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  {job.cargo || job.titulo}
                </h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-600 mt-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">{job.empresa}</span>
                </div>
                
                {(job.localizacao || job.endereco) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{job.localizacao || job.endereco}</span>
                  </div>
                )}
                
                {job.modo_trabalho && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
                    {job.modo_trabalho}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={executeAutoMatch}
              disabled={executingAutoMatch}
              className="ml-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {executingAutoMatch ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Auto-Match com IA
                </>
              )}
            </button>
          </div>

          {executingAutoMatch && (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900 mb-1">
                    Análise Inteligente em Andamento
                  </h4>
                  <p className="text-sm text-indigo-700">
                    Nossa IA está analisando todos os candidatos do seu banco de talentos para encontrar os melhores matches...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Descrição */}
        {job.descricao && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Descrição da Vaga</h2>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.descricao}</p>
          </div>
        )}

        {/* Requisitos */}
        <div className="grid md:grid-cols-2 gap-6">
          {job.requisitos_obrigatorios && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">✅ Requisitos Obrigatórios</h3>
              <p className="text-gray-700 leading-relaxed">{job.requisitos_obrigatorios}</p>
            </div>
          )}

          {job.requisitos_desejaveis && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">⭐ Requisitos Desejáveis</h3>
              <p className="text-gray-700 leading-relaxed">{job.requisitos_desejaveis}</p>
            </div>
          )}
        </div>
      </div>

      {/* Popup de Auto-Match */}
      {showAutoMatchPopup && autoMatchResults && (
        <AutoMatchPopup
          isOpen={showAutoMatchPopup}
          onClose={() => setShowAutoMatchPopup(false)}
          jobData={job}
          matchResults={autoMatchResults}
          onContactCandidate={handleContactCandidate}
        />
      )}
    </div>
  );
};

export default JobDetailPage;
