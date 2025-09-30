// Local: src/features/database/components/CandidateDatabasePage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { Candidate } from '../../../shared/types';
import { Loader2, FilterX, Filter, ChevronDown, Eye, MessageCircle, Trash2 } from 'lucide-react';
import CandidateDetailModal from '../../results/components/CandidateDetailModal';
import { formatPhoneNumberForWhatsApp } from '../../../shared/utils/formatters'; // <-- CORRIGIDO: Removido '}' extra e o 's'
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

            return nameMatch && vagaMatch && sexoMatch && escolaridadeMatch && cidadeMatch && bairroMatch && idadeMatch;
        });
        console.log("Banco de Talentos: filteredCandidates (após filtros):", filtered);
        return filtered;
    }, [allCandidatesFromStore, searchTerm, selectedVaga, selectedSexo, selectedEscolaridade, selectedFaixasEtarias, selectedCidade, selectedBairro]);
    
    const clearFilters = () => {
        setSearchTerm(''); setSelectedVaga(''); setSelectedSexo('');
        setSelectedEscolaridade(''); setSelectedFaixasEtarias([]);
        setSelectedCidade(''); setSelectedBairro('');
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

    const activeFilterCount = [searchTerm, selectedVaga, selectedSexo, selectedEscolaridade, selectedFaixasEtarias.length > 0 ? 'idade' : '', selectedCidade, selectedBairro].filter(Boolean).length;

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

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                     <h3 className="text-xl font-bold text-gray-800 mb-6">
                        {activeFilterCount > 0 ? `Candidatos Encontrados (${filteredCandidates.length})` : `Todos os Candidatos (${allCandidatesFromStore.length})`}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                                <tr className="text-xs text-gray-500 uppercase border-b bg-gray-50">
                                    <th className="px-4 py-3 font-semibold">Candidato</th>
                                    <th className="px-4 py-3 font-semibold">Vaga Original</th>
                                    <th className="px-4 py-3 font-semibold">Score</th>
                                    <th className="px-4 py-3 font-semibold">Data de Entrada</th>
                                    <th className="px-4 py-3 font-semibold">Contato</th>
                                    <th className="px-4 py-3 font-semibold text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCandidates.length > 0 ? (
                                    filteredCandidates.map((candidate) => {
                                        const whatsappNumber = formatPhoneNumberForWhatsApp(candidate.telefone || null);
                                        return (
                                            <tr key={candidate.id} className="border-b hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 font-medium text-gray-800">{candidate.nome}</td>
                                                <td className="px-4 py-4 text-gray-600">{candidate.vaga && candidate.vaga[0] ? candidate.vaga[0].value : 'N/A'}</td>
                                                <td className="px-4 py-4 font-bold text-indigo-600">{candidate.score || 0}%</td>
                                                <td className="px-4 py-4 text-gray-600">
                                                    {candidate.data_triagem 
                                                        ? new Date(candidate.data_triagem).toLocaleDateString('pt-BR')
                                                        : 'Não informado'
                                                    }
                                                </td>
                                                <td className="px-4 py-4 text-gray-600">{candidate.telefone || 'Não informado'}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <button onClick={() => setSelectedCandidate(candidate)} className="p-2 text-gray-500 hover:bg-gray-200 hover:text-indigo-600 rounded-full transition-colors" title="Ver Detalhes">
                                                            <Eye size={18} />
                                                        </button>
                                                        <a href={whatsappNumber ? `https://wa.me/${whatsappNumber}` : undefined} target="_blank" rel="noopener noreferrer" onClick={(e) => !whatsappNumber && e.preventDefault()}
                                                            className={`p-2 rounded-full transition-colors ${!whatsappNumber ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-green-100 hover:text-green-600'}`}
                                                            title={whatsappNumber ? 'Chamar no WhatsApp' : 'Telefone não disponível'}>
                                                            <MessageCircle size={18} />
                                                        </a>
                                                        <button 
                                                            onClick={() => setCandidateToDelete(candidate)} 
                                                            className="p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors" 
                                                            title="Excluir do Banco de Talentos"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-gray-500">
                                            {activeFilterCount > 0 ? 'Nenhum candidato encontrado com os filtros aplicados.' : 'Nenhum talento no banco de dados ainda.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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