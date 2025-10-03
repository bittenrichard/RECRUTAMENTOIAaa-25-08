// src/features/jobs/components/AutoMatchPopup.tsx

import React, { useState } from 'react';
import { X, CheckCircle2, MessageCircle, Star, MapPin, TrendingUp, AlertCircle, Sparkles, Clock } from 'lucide-react';
import './AutoMatchPopup.css';

interface MatchCandidate {
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
}

interface AutoMatchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  jobData: {
    cargo?: string;
    titulo?: string;
    empresa: string;
  };
  matchResults: {
    totalCandidatesAnalyzed: number;
    matchesFound: number;
    matches: MatchCandidate[];
    timeSavedHours: number;
    executionTime: number;
  };
  onContactCandidate: (candidateId: number) => void;
}

export const AutoMatchPopup: React.FC<AutoMatchPopupProps> = ({
  isOpen,
  onClose,
  jobData,
  matchResults,
  onContactCandidate
}) => {
  const [selectedCandidates, setSelectedCandidates] = useState<Set<number>>(new Set());
  const [expandedCandidate, setExpandedCandidate] = useState<number | null>(null);

  if (!isOpen) return null;

  const toggleCandidateSelection = (candidateId: number) => {
    const newSelection = new Set(selectedCandidates);
    if (newSelection.has(candidateId)) {
      newSelection.delete(candidateId);
    } else {
      newSelection.add(candidateId);
    }
    setSelectedCandidates(newSelection);
  };

  const handleContactSelected = () => {
    selectedCandidates.forEach(candidateId => {
      onContactCandidate(candidateId);
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getFitColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="auto-match-overlay">
      <div className="auto-match-popup">
        {/* Header */}
        <div className="auto-match-header">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Auto-Match Completo! 🎯</h2>
              <p className="text-gray-600 mt-1">
                {matchResults.matchesFound} candidatos encontrados para <span className="font-semibold">{jobData.cargo || jobData.titulo}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="auto-match-close-btn">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="auto-match-stats">
          <div className="stat-card">
            <div className="stat-icon bg-blue-100 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="stat-value">{matchResults.totalCandidatesAnalyzed}</div>
              <div className="stat-label">Candidatos Analisados</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-green-100 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="stat-value">{matchResults.matchesFound}</div>
              <div className="stat-label">Matches Encontrados</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-purple-100 text-purple-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="stat-value">{matchResults.timeSavedHours.toFixed(1)}h</div>
              <div className="stat-label">Tempo Economizado</div>
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="auto-match-content">
          {matchResults.matches.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhum candidato encontrado
              </h3>
              <p className="text-gray-600">
                Não encontramos candidatos com compatibilidade suficiente para esta vaga.
              </p>
            </div>
          ) : (
            <div className="candidates-list">
              {matchResults.matches.map((candidate) => (
                <div key={candidate.candidateId} className="candidate-card">
                  <div className="candidate-header" onClick={() => setExpandedCandidate(
                    expandedCandidate === candidate.candidateId ? null : candidate.candidateId
                  )}>
                    <div className="flex items-start gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.has(candidate.candidateId)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleCandidateSelection(candidate.candidateId);
                        }}
                        className="mt-1 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{candidate.candidateName}</h3>
                          <div className={`score-badge ${getScoreColor(candidate.compatibilityScore)}`}>
                            <Star className="h-4 w-4" />
                            <span className="font-bold">{candidate.compatibilityScore}%</span>
                          </div>
                        </div>

                        {candidate.candidateLocation && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                            <MapPin className="h-4 w-4" />
                            <span>{candidate.candidateLocation}</span>
                          </div>
                        )}

                        {/* Fit Analysis Bars */}
                        {candidate.fitAnalysis && (
                          <div className="fit-analysis-bars">
                            {[
                              { label: 'Técnico', value: candidate.fitAnalysis.technical },
                              { label: 'Cultural', value: candidate.fitAnalysis.cultural },
                              { label: 'Experiência', value: candidate.fitAnalysis.experience },
                              { label: 'Localização', value: candidate.fitAnalysis.location },
                              { label: 'Salário', value: candidate.fitAnalysis.salary }
                            ].map(fit => (
                              <div key={fit.label} className="fit-bar-item">
                                <span className="fit-label">{fit.label}</span>
                                <div className="fit-bar-bg">
                                  <div 
                                    className={`fit-bar-fill ${getFitColor(fit.value)}`}
                                    style={{ width: `${fit.value}%` }}
                                  />
                                </div>
                                <span className="fit-value">{fit.value}%</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Match Reasons */}
                        {candidate.matchReasons.length > 0 && (
                          <div className="reasons-section">
                            <h4 className="reasons-title">✅ Por que é um bom match:</h4>
                            <ul className="reasons-list">
                              {candidate.matchReasons.slice(0, 3).map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Risk Factors */}
                        {candidate.riskFactors.length > 0 && (
                          <div className="risks-section">
                            <h4 className="risks-title">⚠️ Pontos de atenção:</h4>
                            <ul className="risks-list">
                              {candidate.riskFactors.slice(0, 2).map((risk, idx) => (
                                <li key={idx}>{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Expanded Details */}
                        {expandedCandidate === candidate.candidateId && (
                          <div className="expanded-details">
                            {candidate.suggestedActions.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 Ações Sugeridas:</h4>
                                <ul className="space-y-1">
                                  {candidate.suggestedActions.map((action, idx) => (
                                    <li key={idx} className="text-sm text-gray-700">• {action}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {candidate.detailedAnalysis && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">📋 Análise Detalhada:</h4>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {candidate.detailedAnalysis}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onContactCandidate(candidate.candidateId);
                      }}
                      className="contact-btn"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Contatar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="auto-match-footer">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{selectedCandidates.size}</span> candidato(s) selecionado(s)
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">
              Fechar
            </button>
            {selectedCandidates.size > 0 && (
              <button onClick={handleContactSelected} className="btn-primary">
                <MessageCircle className="h-5 w-5" />
                Contatar Selecionados
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
