// Local: src/features/database/components/CandidateDatabasePage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { Candidate, CandidateStatus } from '../../../shared/types';
import { Loader2, FilterX, Filter, ChevronDown, Eye, MessageCircle, Trash2, Phone, Calendar, User, Building2, Award } from 'lucide-react';
import CandidateDetailModal from '../../results/components/CandidateDetailModal';
import { formatPhoneNumberForWhatsApp } from '../../../shared/utils/formatters';
import { useDataStore } from '../../../shared/store/useDataStore';
import DeleteCandidateModal from './DeleteCandidateModal';

const sexOptions = ['Masculino', 'Feminino', 'Outro'];
const escolaridadeOptions = [
  'Ensino fundamental incompleto', 'Ensino fundamental completo',
  'Ensino médio incompleto', 'Ensino médio completo',
  'Superior incompleto', 'Superior completo',
  'Pós-graduação', 'Mestrado', 'Doutorado',
];

const faixasEtariasOptions = [
  { label: '18 a 25 anos', min: 18, max: 25 },
  { label: '26 a 30 anos', min: 26, max: 30 },
  { label: '31 a 35 anos', min: 31, max: 35 },
  { label: '36 a 40 anos', min: 36, max: 40 },
  { label: '41 a 45 anos', min: 41, max: 45 },
  { label: '46 a 50 anos', min: 46, max: 50 },
  { label: '51 a 60 anos', min: 51, max: 60 },
  { label: 'Acima de 60 anos', min: 61, max: 120 },
];

const statusOptions: CandidateStatus[] = [
  'Triagem', 'Entrevista', 'Entrevista por Vídeo', 'Teste Teórico', 
  'Entrevista Presencial', 'Teste Prático', 'Aprovado', 'Contratado', 'Reprovado'
];

// Função para gerar mensagens personalizadas do WhatsApp
const generateWhatsAppMessage = (candidate: Candidate, empresa: string = 'nossa empresa') => {
  const status = candidate.status?.value || 'Triagem';
  const nomeCompleto = candidate.nome;
  const primeiroNome = nomeCompleto.split(' ')[0];
  const tituloVaga = candidate.vaga?.[0]?.titulo || 'posição disponível';
  
  const messages: Record<string, string> = {
    'Triagem': `Olá ${primeiroNome}, tudo bem? Aqui é da ${empresa}! 👋\n\nVocê se candidatou para a vaga de *${tituloVaga}* e gostaríamos de dar continuidade ao seu processo seletivo.\n\nPodemos conversar?`,
    
    'Entrevista': `Olá ${primeiroNome}! 😊\n\nParabéns! Você passou para a etapa de entrevista da vaga *${tituloVaga}* na ${empresa}.\n\nVamos agendar uma conversa? Que dia e horário seria melhor para você?`,
    
    'Entrevista por Vídeo': `Olá ${primeiroNome}, tudo bem? Aqui é da ${empresa}, você foi selecionado para a etapa de entrevista da vaga *${tituloVaga}*. 🎥\n\nSiga abaixo as instruções e responda às seguintes perguntas em um único vídeo:\n\n1️⃣ Quem é você e qual é a sua principal experiência profissional?\n\n2️⃣ Por que você gostaria de trabalhar conosco?\n\n3️⃣ Como você lida com situações de pressão ou imprevistos no trabalho?\n\n4️⃣ Qual é a sua maior qualidade que pode contribuir para a nossa equipe?\n\nEnvie o vídeo por aqui mesmo! 📹`,
    
    'Teste Teórico': `Olá ${primeiroNome}! 📚\n\nParabéns por avançar no processo seletivo da vaga *${tituloVaga}*!\n\nAgora você foi selecionado para realizar um teste teórico. Em breve enviaremos o link com as instruções.\n\nFique atento às mensagens! 🎯`,
    
    'Entrevista Presencial': `Olá ${primeiroNome}! 🎉\n\nParabéns! Você foi aprovado para a etapa final - entrevista presencial da vaga *${tituloVaga}*!\n\nVamos agendar um encontro em nossa empresa. Que dia seria melhor para você?`,
    
    'Teste Prático': `Olá ${primeiroNome}! 💪\n\nVocê foi selecionado para realizar um teste prático da vaga *${tituloVaga}*!\n\nEste é um grande passo no seu processo seletivo. Em breve entraremos em contato com mais detalhes.`,
    
    'Aprovado': `🎉 PARABÉNS ${primeiroNome}! 🎉\n\nTemos uma excelente notícia: você foi *APROVADO* para a vaga *${tituloVaga}* na ${empresa}!\n\nEm breve entraremos em contato para acertarmos os detalhes. Bem-vindo à equipe! 🚀`,
    
    'Contratado': `Olá ${primeiroNome}! 🤝\n\nSeja muito bem-vindo à ${empresa}!\n\nVamos alinhar os últimos detalhes da sua contratação para a posição de *${tituloVaga}*.\n\nEstamos ansiosos para tê-lo em nossa equipe! 🎊`,
    
    'Reprovado': `Olá ${primeiroNome}, tudo bem? 😊\n\nObrigado pelo seu interesse na vaga *${tituloVaga}* e pela participação no nosso processo seletivo.\n\nInfelizmente, não seguiremos com sua candidatura desta vez, mas seu perfil ficará em nosso banco de talentos para futuras oportunidades!\n\nContinue se candidatando às nossas vagas! 💪`
  };
  
  return messages[status] || messages['Triagem'];
};

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full py-10">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
        <h2 className="mt-4 text-xl font-semibold text-gray-800">Carregando Talentos...</h2>
    </div>
);

const CandidateDatabasePage: React.FC = () => {

    const { candidates: allCandidatesFromStore, isDataLoading, deleteCandidateById } = useDataStore();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVaga, setSelectedVaga] = useState('');
    const [selectedSexo, setSelectedSexo] = useState('');
    const [selectedEscolaridade, setSelectedEscolaridade] = useState('');
    const [selectedFaixasEtarias, setSelectedFaixasEtarias] = useState<string[]>([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedCidade, setSelectedCidade] = useState('');
    const [selectedBairro, setSelectedBairro] = useState('');

    const [showFilters, setShowFilters] = useState(true);
    const [vagas, setVagas] = useState<string[]>([]);
    const [cidades, setCidades] = useState<string[]>([]);
    const [bairros, setBairros] = useState<string[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        console.log("Banco de Talentos: allCandidatesFromStore (brutos):", allCandidatesFromStore);
        
        // Processar vagas
        const uniqueVagas = [...new Set(allCandidatesFromStore.flatMap(c => c.vaga?.map(v => v.value) || []).filter(Boolean) as string[])].sort();
        setVagas(uniqueVagas);
        
        // Processar cidades
        const uniqueCidades = [...new Set(
            allCandidatesFromStore
                .map(c => c.cidade)
                .filter(Boolean)
                .map(c => String(c).trim())
                .filter(c => c.length > 0)
        )].sort();
        setCidades(uniqueCidades);
        
        // Processar bairros
        const uniqueBairros = [...new Set(
            allCandidatesFromStore
                .map(c => c.bairro)
                .filter(Boolean)
                .map(b => String(b).trim())
                .filter(b => b.length > 0)
        )].sort();
        setBairros(uniqueBairros);
    }, [allCandidatesFromStore]);

    const filteredCandidates = useMemo(() => {
        const filtered = allCandidatesFromStore.filter(candidate => {
            const searchLower = searchTerm.toLowerCase();
            const nameMatch = searchTerm ? candidate.nome.toLowerCase().includes(searchLower) : true;
            
            const vagaMatch = selectedVaga 
                ? (candidate.vaga && candidate.vaga.some(v => v.value === selectedVaga)) 
                : true;
            
            const sexoMatch = selectedSexo 
                ? (candidate.sexo && candidate.sexo.toLowerCase() === selectedSexo.toLowerCase()) 
                : true;
            
            const escolaridadeMatch = selectedEscolaridade 
                ? (candidate.escolaridade && candidate.escolaridade.toLowerCase() === selectedEscolaridade.toLowerCase())
                : true;

            // Filtro de cidade
            const cidadeMatch = selectedCidade 
                ? (candidate.cidade && candidate.cidade.toLowerCase().includes(selectedCidade.toLowerCase()))
                : true;

            // Filtro de bairro
            const bairroMatch = selectedBairro 
                ? (candidate.bairro && candidate.bairro.toLowerCase().includes(selectedBairro.toLowerCase()))
                : true;

            // Filtro de status
            const statusMatch = selectedStatus 
                ? (candidate.status?.value === selectedStatus)
                : true;

            // Filtro de idade (múltiplas faixas etárias)
            let idadeMatch = true;
            
            if (selectedFaixasEtarias.length > 0 && candidate.idade !== undefined && candidate.idade !== null) {
                const idade = Number(candidate.idade);
                idadeMatch = selectedFaixasEtarias.some(faixaLabel => {
                    const faixa = faixasEtariasOptions.find(f => f.label === faixaLabel);
                    if (faixa) {
                        return idade >= faixa.min && idade <= faixa.max;
                    }
                    return false;
                });
            }

            return nameMatch && vagaMatch && sexoMatch && escolaridadeMatch && cidadeMatch && bairroMatch && statusMatch && idadeMatch;
        });
        console.log("Banco de Talentos: filteredCandidates (após filtros):", filtered);
        return filtered;
    }, [allCandidatesFromStore, searchTerm, selectedVaga, selectedSexo, selectedEscolaridade, selectedFaixasEtarias, selectedStatus, selectedCidade, selectedBairro]);
    
    const clearFilters = () => {
        setSearchTerm(''); setSelectedVaga(''); setSelectedSexo('');
        setSelectedEscolaridade(''); setSelectedFaixasEtarias([]);
        setSelectedStatus(''); setSelectedCidade(''); setSelectedBairro('');
    };

    const handleDeleteCandidate = async () => {
        if (!candidateToDelete) return;
        
        setIsDeleting(true);
        try {
            await deleteCandidateById(candidateToDelete.id);
            setCandidateToDelete(null);
        } catch (error) {
            console.error("Erro ao excluir candidato:", error);
            alert("Não foi possível excluir o candidato. Tente novamente.");
        } finally {
            setIsDeleting(false);
        }
    };

    const activeFilterCount = [searchTerm, selectedVaga, selectedSexo, selectedEscolaridade, selectedStatus, selectedFaixasEtarias.length > 0 ? 'idade' : '', selectedCidade, selectedBairro].filter(Boolean).length;

    if (isDataLoading) return <LoadingSpinner />;

    return (
        <>
            <div className="fade-in">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Banco de Talentos</h1>
                        <p className="text-gray-600">Pesquise e reaproveite candidatos de processos seletivos anteriores.</p>
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-semibold rounded-md hover:bg-gray-50 border border-gray-300 transition-colors shadow-sm">
                        <Filter size={18} className="text-indigo-600"/>
                        <span>Filtros</span>
                        {activeFilterCount > 0 && (<span className="bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>)}
                        <ChevronDown size={18} className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showFilters && (
                    <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por nome</label>
                                <input type="text" placeholder="Nome do candidato..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full text-sm border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vaga</label>
                                <select value={selectedVaga} onChange={e => setSelectedVaga(e.target.value)} className="w-full text-sm border-gray-300 rounded-md">
                                    <option value="">Todas</option>
                                    {vagas.map(vaga => <option key={vaga} value={vaga}>{vaga}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                                <select value={selectedSexo} onChange={e => setSelectedSexo(e.target.value)} className="w-full text-sm border-gray-300 rounded-md">
                                    <option value="">Todos</option>
                                    {sexOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Escolaridade</label>
                                <select value={selectedEscolaridade} onChange={e => setSelectedEscolaridade(e.target.value)} className="w-full text-sm border-gray-300 rounded-md">
                                    <option value="">Todas</option>
                                    {escolaridadeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="w-full text-sm border-gray-300 rounded-md">
                                    <option value="">Todos</option>
                                    {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                            
                            {/* Novos filtros: Cidade, Bairro */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                                <select value={selectedCidade} onChange={e => setSelectedCidade(e.target.value)} className="w-full text-sm border-gray-300 rounded-md">
                                    <option value="">Todas</option>
                                    {cidades.map(cidade => <option key={cidade} value={cidade}>{cidade}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                                <select value={selectedBairro} onChange={e => setSelectedBairro(e.target.value)} className="w-full text-sm border-gray-300 rounded-md">
                                    <option value="">Todos</option>
                                    {bairros.map(bairro => <option key={bairro} value={bairro}>{bairro}</option>)}
                                </select>
                            </div>
                            
                            {/* Filtros de Faixa Etária (múltipla seleção) */}
                            <div className="col-span-full">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Faixas Etárias</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {faixasEtariasOptions.map(faixa => (
                                        <label key={faixa.label} className="flex items-center space-x-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedFaixasEtarias.includes(faixa.label)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedFaixasEtarias(prev => [...prev, faixa.label]);
                                                    } else {
                                                        setSelectedFaixasEtarias(prev => prev.filter(f => f !== faixa.label));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-gray-700">{faixa.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button onClick={clearFilters} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                                <FilterX size={16} /> Limpar Filtros
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista modernizada de candidatos em cards */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">
                            {activeFilterCount > 0 ? `Candidatos Encontrados (${filteredCandidates.length})` : `Todos os Candidatos (${allCandidatesFromStore.length})`}
                        </h3>
                    </div>
                    
                    {filteredCandidates.length > 0 ? (
                        <div className="grid gap-4">
                            {filteredCandidates.map((candidate) => {
                                const whatsappNumber = formatPhoneNumberForWhatsApp(candidate.telefone || null);
                                const whatsappMessage = generateWhatsAppMessage(candidate, 'nossa empresa');
                                const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}` : undefined;
                                
                                // Função para determinar a cor do status
                                const getStatusColor = (status?: string) => {
                                    switch (status) {
                                        case 'Aprovado': return 'bg-green-100 text-green-800 border-green-200';
                                        case 'Contratado': return 'bg-blue-100 text-blue-800 border-blue-200';
                                        case 'Reprovado': return 'bg-red-100 text-red-800 border-red-200';
                                        case 'Entrevista por Vídeo': return 'bg-purple-100 text-purple-800 border-purple-200';
                                        case 'Teste Teórico': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                                        case 'Entrevista Presencial': return 'bg-orange-100 text-orange-800 border-orange-200';
                                        case 'Teste Prático': return 'bg-pink-100 text-pink-800 border-pink-200';
                                        case 'Entrevista': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
                                        case 'Triagem': return 'bg-gray-100 text-gray-800 border-gray-200';
                                        default: return 'bg-gray-100 text-gray-800 border-gray-200';
                                    }
                                };
                                
                                return (
                                    <div key={candidate.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-lg font-semibold text-gray-900">{candidate.nome}</h4>
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(candidate.status?.value)}`}>
                                                        {candidate.status?.value || 'Triagem'}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 size={16} className="text-gray-400" />
                                                        <span>{candidate.vaga?.[0]?.titulo || candidate.vaga?.[0]?.value || 'Vaga não especificada'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Award size={16} className="text-gray-400" />
                                                        <span className="font-medium text-indigo-600">{candidate.score || 0}% de compatibilidade</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={16} className="text-gray-400" />
                                                        <span>{candidate.telefone || 'Não informado'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={16} className="text-gray-400" />
                                                        <span>
                                                            {candidate.data_triagem 
                                                                ? new Date(candidate.data_triagem).toLocaleDateString('pt-BR')
                                                                : 'Data não informada'
                                                            }
                                                        </span>
                                                    </div>
                                                    {candidate.idade && (
                                                        <div className="flex items-center gap-2">
                                                            <User size={16} className="text-gray-400" />
                                                            <span>{candidate.idade} anos</span>
                                                        </div>
                                                    )}
                                                    {candidate.cidade && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-400">📍</span>
                                                            <span>{candidate.cidade}{candidate.bairro ? `, ${candidate.bairro}` : ''}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Ações */}
                                            <div className="flex items-center gap-2 ml-4">
                                                <button 
                                                    onClick={() => setSelectedCandidate(candidate)} 
                                                    className="p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-colors" 
                                                    title="Ver Detalhes Completos"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                
                                                {whatsappUrl ? (
                                                    <a 
                                                        href={whatsappUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-gray-500 hover:bg-green-50 hover:text-green-600 rounded-full transition-colors" 
                                                        title={`Enviar mensagem personalizada para ${candidate.status?.value || 'Triagem'}`}
                                                    >
                                                        <MessageCircle size={18} />
                                                    </a>
                                                ) : (
                                                    <div className="p-2 text-gray-300 cursor-not-allowed rounded-full" title="Telefone não disponível">
                                                        <MessageCircle size={18} />
                                                    </div>
                                                )}
                                                
                                                <button 
                                                    onClick={() => setCandidateToDelete(candidate)} 
                                                    className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors" 
                                                    title="Excluir do Banco de Talentos"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Informações adicionais */}
                                        {candidate.escolaridade && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <span className="text-sm text-gray-500">Escolaridade: </span>
                                                <span className="text-sm font-medium text-gray-700">{candidate.escolaridade}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <div className="text-gray-400 mb-3">
                                <User size={48} className="mx-auto" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {activeFilterCount > 0 ? 'Nenhum candidato encontrado' : 'Banco de talentos vazio'}
                            </h3>
                            <p className="text-gray-500">
                                {activeFilterCount > 0 
                                    ? 'Tente ajustar os filtros para encontrar candidatos.' 
                                    : 'Os candidatos aparecerão aqui conforme novos processos seletivos forem realizados.'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>
            {selectedCandidate && (<CandidateDetailModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} onScheduleInterview={() => {}} onUpdateStatus={() => {}} onDataSynced={() => {}} />)}
            
            {candidateToDelete && (
                <DeleteCandidateModal
                    candidateName={candidateToDelete.nome}
                    onClose={() => setCandidateToDelete(null)}
                    onConfirm={handleDeleteCandidate}
                    isDeleting={isDeleting}
                />
            )}
        </>
    );
};

export default CandidateDatabasePage;