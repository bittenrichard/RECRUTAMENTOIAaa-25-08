import React, { useState } from 'react';
import { ArrowLeft, Building2, MapPin, FileText, Clock, Users, Check, CheckSquare, X, Save } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

interface RequirementsData {
  // Dados básicos
  idade?: { min: string; max: string };
  
  // Localização & Mobilidade
  cidade_estado?: { cidade: string; estado: string; regioes: string[] };
  distancia?: { maxima: string; calculo_automatico: boolean };
  cnh?: string[];
  
  // Formação Acadêmica
  escolaridade_minima?: string;
  area_formacao?: string[];
  cursos_complementares?: string[];
  pos_graduacao?: { nivel: string; obrigatorio: boolean };
  
  // Histórico Profissional
  tempo_total_experiencia?: { minimo: string; preferencial: string };
  tempo_funcao_especifica?: { funcao: string; tempo_minimo: string };
  experiencia_setor?: string[];
  porte_empresa?: string[];
  cargos_lideranca?: { tamanho_equipe: string; nivel: string };
  
  // Habilidades Técnicas
  tecnologias_softwares?: {nome: string, nivel: string, obrigatorio: boolean}[];
  idiomas?: {idioma: string, nivel: string, obrigatorio: boolean}[];
  certificacoes_tecnicas?: {nome: string, obrigatorio: boolean}[];
  registros_profissionais?: string[];
  
  // Soft Skills
  soft_skills?: string[];
}

interface JobData {
  id?: number; // ID retornado pelo Baserow
  titulo: string;
  endereco: string;
  modo_trabalho: 'presencial' | 'remoto' | 'hibrido';
  descricao: string;
  requisitos: RequirementsData; // Para compatibilidade (pode ser removido depois)
  requisitos_json: string; // Nova coluna no banco
  criado_em: string;
}

interface NewScreeningChecklistPageProps {
  onJobCreated: (newJob: JobData) => void;
  onCancel: () => void;
}

const NewScreeningChecklistPage: React.FC<NewScreeningChecklistPageProps> = ({
  onJobCreated,
  onCancel
}) => {
  // Hook para capturar o usuário logado
  const { profile } = useAuth();

  // Estados básicos do formulário
  const [jobTitle, setJobTitle] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [workMode, setWorkMode] = useState<'presencial' | 'remoto' | 'hibrido'>('presencial');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados dos requisitos organizados por categoria
  const [basicRequirements, setBasicRequirements] = useState({
    idade: false
  });

  const [locationRequirements, setLocationRequirements] = useState({
    cidade_estado: false,
    distancia: false,
    cnh: false
  });

  const [educationRequirements, setEducationRequirements] = useState({
    escolaridade_minima: false,
    area_formacao: false,
    cursos_complementares: false,
    pos_graduacao: false
  });

  const [experienceRequirements, setExperienceRequirements] = useState({
    tempo_total_experiencia: false,
    tempo_funcao_especifica: false,
    experiencia_setor: false,
    porte_empresa: false,
    cargos_lideranca: false
  });

  const [technicalRequirements, setTechnicalRequirements] = useState({
    tecnologias_softwares: false,
    idiomas: false,
    certificacoes_tecnicas: false,
    registros_profissionais: false
  });

  const [softSkillsRequirements, setSoftSkillsRequirements] = useState({
    soft_skills: false
  });

  // Estados para configurações específicas
  const [idadeConfig, setIdadeConfig] = useState({ min: '18', max: '65' });
  const [cidadeEstadoConfig, setCidadeEstadoConfig] = useState({ cidade: '', estado: '', regioes: [] as string[] });
  const [distanciaConfig, setDistanciaConfig] = useState({ maxima: '', calculo_automatico: true });
  const [cnhConfig, setCnhConfig] = useState<string[]>([]);
  const [escolaridadeConfig, setEscolaridadeConfig] = useState('');
  const [areaFormacaoConfig, setAreaFormacaoConfig] = useState<string[]>([]);
  const [cursosComplementaresConfig, setCursosComplementaresConfig] = useState<string[]>([]);
  const [posGraduacaoConfig, setPosGraduacaoConfig] = useState({ nivel: '', obrigatorio: false });
  const [tempoTotalConfig, setTempoTotalConfig] = useState({ minimo: '', preferencial: '' });
  const [tempoFuncaoConfig, setTempoFuncaoConfig] = useState({ funcao: '', tempo_minimo: '' });
  const [experienciaSetorConfig, setExperienciaSetorConfig] = useState<string[]>([]);
  const [porteEmpresaConfig, setPorteEmpresaConfig] = useState<string[]>([]);
  const [liderancaConfig, setLiderancaConfig] = useState({ tamanho_equipe: '', nivel: '' });
  const [tecnologiasConfig, setTecnologiasConfig] = useState<{nome: string, nivel: string, obrigatorio: boolean}[]>([]);
  const [idiomasConfig, setIdiomasConfig] = useState<{idioma: string, nivel: string, obrigatorio: boolean}[]>([]);
  const [certificacoesConfig, setCertificacoesConfig] = useState<{nome: string, obrigatorio: boolean}[]>([]);
  const [registrosConfig, setRegistrosConfig] = useState<string[]>([]);
  const [softSkillsConfig, setSoftSkillsConfig] = useState<string[]>([]);

  // Funções para adicionar/remover itens dinâmicos
  const addTecnologia = () => {
    setTecnologiasConfig(prev => [...prev, { nome: '', nivel: 'basico', obrigatorio: false }]);
  };

  const removeTecnologia = (index: number) => {
    setTecnologiasConfig(prev => prev.filter((_, i) => i !== index));
  };

  const addIdioma = () => {
    setIdiomasConfig(prev => [...prev, { idioma: '', nivel: 'basico', obrigatorio: false }]);
  };

  const removeIdioma = (index: number) => {
    setIdiomasConfig(prev => prev.filter((_, i) => i !== index));
  };

  const addCertificacao = () => {
    setCertificacoesConfig(prev => [...prev, { nome: '', obrigatorio: false }]);
  };

  const removeCertificacao = (index: number) => {
    setCertificacoesConfig(prev => prev.filter((_, i) => i !== index));
  };

  const addAreaFormacao = () => {
    setAreaFormacaoConfig(prev => [...prev, '']);
  };

  const removeAreaFormacao = (index: number) => {
    setAreaFormacaoConfig(prev => prev.filter((_, i) => i !== index));
  };

  const addCursoComplementar = () => {
    setCursosComplementaresConfig(prev => [...prev, '']);
  };

  const removeCursoComplementar = (index: number) => {
    setCursosComplementaresConfig(prev => prev.filter((_, i) => i !== index));
  };

  const addSoftSkill = () => {
    setSoftSkillsConfig(prev => [...prev, '']);
  };

  const removeSoftSkill = (index: number) => {
    setSoftSkillsConfig(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validação crítica: verificar se o usuário está logado
    if (!profile || !profile.id) {
      console.error('❌ ERRO CRÍTICO: Usuário não está logado!');
      alert('Erro: Você precisa estar logado para criar vagas. Faça login novamente.');
      setIsSubmitting(false);
      return;
    }

    // Validações obrigatórias dos campos básicos
    if (!jobTitle.trim()) {
      alert('Por favor, preencha o Título da Vaga.');
      setIsSubmitting(false);
      return;
    }

    if (!description.trim()) {
      alert('Por favor, preencha a Descrição da Vaga.');
      setIsSubmitting(false);
      return;
    }

    // Validar endereço se necessário (presencial ou híbrido)
    if ((workMode === 'presencial' || workMode === 'hibrido') && !workLocation.trim()) {
      alert('Por favor, preencha o Endereço do Local de Trabalho para vagas presenciais ou híbridas.');
      setIsSubmitting(false);
      return;
    }

    console.log('👤 USUÁRIO LOGADO:', {
      id: profile.id,
      nome: profile.nome,
      email: profile.email,
      empresa: profile.empresa
    });

    try {
      // Preparar dados dos requisitos conforme nova estrutura
      const requirementsData: RequirementsData = {};

      // Dados Básicos
      if (basicRequirements.idade) {
        requirementsData.idade = idadeConfig;
      }

      // Localização & Mobilidade
      if (locationRequirements.cidade_estado) {
        requirementsData.cidade_estado = cidadeEstadoConfig;
      }
      if (locationRequirements.distancia) {
        requirementsData.distancia = distanciaConfig;
      }
      if (locationRequirements.cnh) {
        requirementsData.cnh = cnhConfig;
      }

      // Formação Acadêmica
      if (educationRequirements.escolaridade_minima) {
        requirementsData.escolaridade_minima = escolaridadeConfig;
      }
      if (educationRequirements.area_formacao) {
        requirementsData.area_formacao = areaFormacaoConfig;
      }
      if (educationRequirements.cursos_complementares) {
        requirementsData.cursos_complementares = cursosComplementaresConfig;
      }
      if (educationRequirements.pos_graduacao) {
        requirementsData.pos_graduacao = posGraduacaoConfig;
      }

      // Histórico Profissional
      if (experienceRequirements.tempo_total_experiencia) {
        requirementsData.tempo_total_experiencia = tempoTotalConfig;
      }
      if (experienceRequirements.tempo_funcao_especifica) {
        requirementsData.tempo_funcao_especifica = tempoFuncaoConfig;
      }
      if (experienceRequirements.experiencia_setor) {
        requirementsData.experiencia_setor = experienciaSetorConfig;
      }
      if (experienceRequirements.porte_empresa) {
        requirementsData.porte_empresa = porteEmpresaConfig;
      }
      if (experienceRequirements.cargos_lideranca) {
        requirementsData.cargos_lideranca = liderancaConfig;
      }

      // Habilidades Técnicas
      if (technicalRequirements.tecnologias_softwares) {
        requirementsData.tecnologias_softwares = tecnologiasConfig;
      }
      if (technicalRequirements.idiomas) {
        requirementsData.idiomas = idiomasConfig;
      }
      if (technicalRequirements.certificacoes_tecnicas) {
        requirementsData.certificacoes_tecnicas = certificacoesConfig;
      }
      if (technicalRequirements.registros_profissionais) {
        requirementsData.registros_profissionais = registrosConfig;
      }

      // Soft Skills
      if (softSkillsRequirements.soft_skills) {
        requirementsData.soft_skills = softSkillsConfig;
      }

      // Criar objeto da vaga com requisitos em JSON
      const newJob: JobData = {
        titulo: jobTitle,
        endereco: workLocation,
        modo_trabalho: workMode,
        descricao: description,
        requisitos: requirementsData, // Para compatibilidade
        requisitos_json: JSON.stringify(requirementsData), // Nova coluna no banco
        criado_em: new Date().toISOString(),
      };

      console.log('📝 Dados da nova vaga:', {
        titulo: jobTitle,
        criada_por_usuario: {
          id: profile.id,
          nome: profile.nome,
          email: profile.email
        },
        requisitos_estruturados: requirementsData,
        requisitos_json_preview: JSON.stringify(requirementsData, null, 2)
      });

      // Enviar para a API real
      console.log('💾 Enviando vaga para o backend...');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      
      const jobPayload = {
        titulo: jobTitle,
        endereco: workLocation,
        modo_trabalho: workMode,
        descricao: description,
        requisitos_json: JSON.stringify(requirementsData), // Nova coluna no banco
        usuario: [profile.id] // ID do usuário logado (CORRIGIDO!)
      };

      console.log('📦 PAYLOAD FINAL (usuário correto):', {
        ...jobPayload,
        usuario_info: {
          id: profile.id,
          nome: profile.nome,
          email: profile.email
        },
        requisitos_json: '[JSON DATA]'
      });

      const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar vaga');
      }

      const createdJob = await response.json();
      console.log('✅ Vaga criada com sucesso:', createdJob);
      console.log('🔑 ID da vaga retornado pelo Baserow:', createdJob.id);
      console.log('📦 Objeto completo:', JSON.stringify(createdJob, null, 2));

      // Passar o objeto com o ID real do Baserow
      const jobWithId = {
        ...newJob,
        id: createdJob.id // ID real do Baserow
      };
      
      console.log('📤 Chamando onJobCreated com:', jobWithId);
      console.log('🆔 ID final sendo passado:', jobWithId.id);
      
      onJobCreated(jobWithId);
    } catch (error) {
      console.error('Erro ao criar vaga:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo - removido sticky, agora é fixed */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onCancel}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <ArrowLeft size={20} className="mr-2" />
                Voltar
              </button>
              <div className="ml-6 flex items-center">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <Building2 size={16} className="text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Criar Nova Triagem de Vaga</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - com padding-top para compensar header fixo */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Bloco 1: Informações Básicas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Building2 size={20} className="mr-2 text-indigo-600" />
              Informações Básicas
            </h2>
            
            <div className="space-y-6">
              {/* Título da Vaga */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Vaga *
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                  placeholder="Ex: Vendedor, Recepcionista, Desenvolvedor..."
                  required
                />
              </div>

              {/* Modo de Trabalho */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modalidade de Trabalho *
                </label>
                
                {/* Botões de Modo de Trabalho */}
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setWorkMode('presencial')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      workMode === 'presencial' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Presencial
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkMode('remoto')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      workMode === 'remoto' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Remoto
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkMode('hibrido')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      workMode === 'hibrido' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Híbrido
                  </button>
                </div>
                
                {/* Campo de endereço - só aparece se não for remoto */}
                {workMode !== 'remoto' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço do Local de Trabalho *
                    </label>
                    <input
                      type="text"
                      value={workLocation}
                      onChange={(e) => setWorkLocation(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ex: São Paulo - Centro, Rua ABC, 123"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {workMode === 'hibrido' ? 'Endereço para os dias presenciais' : 'Endereço onde o funcionário trabalhará'}
                    </p>
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição da Vaga *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Descreva as principais atividades e responsabilidades..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Bloco 2: Requisitos (Estrutura Hierárquica) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <CheckSquare size={20} className="mr-2 text-green-600" />
              Requisitos da Vaga
            </h2>
            
            <p className="text-gray-600 mb-8">
              Selecione os critérios de triagem para esta vaga. Cada categoria pode ter múltiplos requisitos específicos.
            </p>

            <div className="space-y-8">
              {/* 1. DADOS BÁSICOS */}
              <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <Users size={18} className="mr-2" />
                  Dados Básicos
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={basicRequirements.idade}
                      onChange={(e) => setBasicRequirements(prev => ({ ...prev, idade: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Idade</span>
                      <p className="text-sm text-gray-600">Faixa etária específica para a função</p>
                    </div>
                  </label>
                  
                  {basicRequirements.idade && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-blue-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Idade mínima</label>
                          <select
                            value={idadeConfig.min}
                            onChange={(e) => setIdadeConfig(prev => ({ ...prev, min: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Selecionar</option>
                            <option value="16">16 anos</option>
                            <option value="18">18 anos</option>
                            <option value="21">21 anos</option>
                            <option value="25">25 anos</option>
                            <option value="30">30 anos</option>
                            <option value="35">35 anos</option>
                            <option value="40">40 anos</option>
                            <option value="45">45 anos</option>
                            <option value="50">50 anos</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Idade máxima</label>
                          <select
                            value={idadeConfig.max}
                            onChange={(e) => setIdadeConfig(prev => ({ ...prev, max: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Selecionar</option>
                            <option value="30">30 anos</option>
                            <option value="35">35 anos</option>
                            <option value="40">40 anos</option>
                            <option value="45">45 anos</option>
                            <option value="50">50 anos</option>
                            <option value="55">55 anos</option>
                            <option value="60">60 anos</option>
                            <option value="65">65 anos</option>
                            <option value="70">70 anos</option>
                            <option value="sem_limite">Sem limite máximo</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. LOCALIZAÇÃO */}
              <div className="border border-green-200 rounded-lg p-6 bg-green-50">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <MapPin size={18} className="mr-2" />
                  Localização
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={locationRequirements.cidade_estado}
                      onChange={(e) => setLocationRequirements(prev => ({ ...prev, cidade_estado: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Cidade/Estado</span>
                      <p className="text-sm text-gray-600">Onde o candidato deve morar ou trabalhar</p>
                    </div>
                  </label>
                  
                  {locationRequirements.cidade_estado && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-green-200">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                          <input
                            type="text"
                            value={cidadeEstadoConfig.cidade}
                            onChange={(e) => setCidadeEstadoConfig(prev => ({ ...prev, cidade: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="São Paulo"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                          <select
                            value={cidadeEstadoConfig.estado}
                            onChange={(e) => setCidadeEstadoConfig(prev => ({ ...prev, estado: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Selecionar</option>
                            <option value="SP">São Paulo</option>
                            <option value="RJ">Rio de Janeiro</option>
                            <option value="MG">Minas Gerais</option>
                            <option value="RS">Rio Grande do Sul</option>
                            <option value="PR">Paraná</option>
                            <option value="SC">Santa Catarina</option>
                            <option value="GO">Goiás</option>
                            <option value="MT">Mato Grosso</option>
                            <option value="MS">Mato Grosso do Sul</option>
                            <option value="DF">Distrito Federal</option>
                            <option value="BA">Bahia</option>
                            <option value="PE">Pernambuco</option>
                            <option value="CE">Ceará</option>
                            <option value="PA">Pará</option>
                            <option value="AM">Amazonas</option>
                            <option value="MA">Maranhão</option>
                            <option value="PB">Paraíba</option>
                            <option value="RN">Rio Grande do Norte</option>
                            <option value="AL">Alagoas</option>
                            <option value="SE">Sergipe</option>
                            <option value="PI">Piauí</option>
                            <option value="AC">Acre</option>
                            <option value="RO">Rondônia</option>
                            <option value="RR">Roraima</option>
                            <option value="AP">Amapá</option>
                            <option value="TO">Tocantins</option>
                            <option value="ES">Espírito Santo</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Regiões aceitas (opcional)</label>
                        <input
                          type="text"
                          placeholder="Ex: Grande São Paulo, ABC, Interior..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  )}
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={locationRequirements.distancia}
                      onChange={(e) => setLocationRequirements(prev => ({ ...prev, distancia: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Distância (cálculo automático)</span>
                      <p className="text-sm text-gray-600">Distância máxima do local de trabalho</p>
                    </div>
                  </label>
                  
                  {locationRequirements.distancia && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-green-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Distância máxima (km)</label>
                          <input
                            type="number"
                            value={distanciaConfig.maxima}
                            onChange={(e) => setDistanciaConfig(prev => ({ ...prev, maxima: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="30"
                          />
                        </div>
                        <div>
                          <label className="flex items-center mt-6">
                            <input
                              type="checkbox"
                              checked={distanciaConfig.calculo_automatico}
                              onChange={(e) => setDistanciaConfig(prev => ({ ...prev, calculo_automatico: e.target.checked }))}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Cálculo automático via Maps</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={locationRequirements.cnh}
                      onChange={(e) => setLocationRequirements(prev => ({ ...prev, cnh: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">CNH</span>
                      <p className="text-sm text-gray-600">Carteira de motorista necessária</p>
                    </div>
                  </label>
                  
                  {locationRequirements.cnh && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-green-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categorias necessárias</label>
                      <div className="flex flex-wrap gap-2">
                        {['A', 'B', 'C', 'D', 'E'].map(categoria => (
                          <label key={categoria} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={cnhConfig.includes(categoria)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCnhConfig(prev => [...prev, categoria]);
                                } else {
                                  setCnhConfig(prev => prev.filter(c => c !== categoria));
                                }
                              }}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm font-medium">Categoria {categoria}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. FORMAÇÃO ACADÊMICA */}
              <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <FileText size={18} className="mr-2" />
                  Formação Acadêmica
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={educationRequirements.escolaridade_minima}
                      onChange={(e) => setEducationRequirements(prev => ({ ...prev, escolaridade_minima: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Escolaridade mínima</span>
                      <p className="text-sm text-gray-600">Nível de ensino obrigatório</p>
                    </div>
                  </label>
                  
                  {educationRequirements.escolaridade_minima && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-purple-200">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nível mínimo</label>
                      <select
                        value={escolaridadeConfig}
                        onChange={(e) => setEscolaridadeConfig(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Selecionar</option>
                        <option value="fundamental_incompleto">Ensino Fundamental Incompleto</option>
                        <option value="fundamental_completo">Ensino Fundamental Completo</option>
                        <option value="medio_incompleto">Ensino Médio Incompleto</option>
                        <option value="medio_completo">Ensino Médio Completo</option>
                        <option value="tecnico">Curso Técnico</option>
                        <option value="superior_incompleto">Superior Incompleto</option>
                        <option value="superior_completo">Superior Completo</option>
                        <option value="pos_graduacao">Pós-graduação</option>
                        <option value="mestrado">Mestrado</option>
                        <option value="doutorado">Doutorado</option>
                      </select>
                    </div>
                  )}
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={educationRequirements.area_formacao}
                      onChange={(e) => setEducationRequirements(prev => ({ ...prev, area_formacao: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Área de formação</span>
                      <p className="text-sm text-gray-600">Curso superior específico</p>
                    </div>
                  </label>
                  
                  {educationRequirements.area_formacao && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={addAreaFormacao}
                          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                        >
                          + Adicionar Área
                        </button>
                      </div>
                      {areaFormacaoConfig.map((area, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={area}
                            onChange={(e) => {
                              const newAreas = [...areaFormacaoConfig];
                              newAreas[index] = e.target.value;
                              setAreaFormacaoConfig(newAreas);
                            }}
                            placeholder="Ex: Administração, Engenharia, Psicologia..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeAreaFormacao(index)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={educationRequirements.cursos_complementares}
                      onChange={(e) => setEducationRequirements(prev => ({ ...prev, cursos_complementares: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Cursos complementares</span>
                      <p className="text-sm text-gray-600">Capacitações, certificações, workshops</p>
                    </div>
                  </label>
                  
                  {educationRequirements.cursos_complementares && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={addCursoComplementar}
                          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                        >
                          + Adicionar Curso
                        </button>
                      </div>
                      {cursosComplementaresConfig.map((curso, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={curso}
                            onChange={(e) => {
                              const newCursos = [...cursosComplementaresConfig];
                              newCursos[index] = e.target.value;
                              setCursosComplementaresConfig(newCursos);
                            }}
                            placeholder="Ex: Excel Avançado, Gestão de Projetos..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeCursoComplementar(index)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={educationRequirements.pos_graduacao}
                      onChange={(e) => setEducationRequirements(prev => ({ ...prev, pos_graduacao: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Pós-graduação / Mestrado / Doutorado</span>
                      <p className="text-sm text-gray-600">Formação acadêmica avançada</p>
                    </div>
                  </label>
                  
                  {educationRequirements.pos_graduacao && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-purple-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
                          <select
                            value={posGraduacaoConfig.nivel}
                            onChange={(e) => setPosGraduacaoConfig(prev => ({ ...prev, nivel: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Selecionar</option>
                            <option value="especializacao">Especialização/Pós-graduação</option>
                            <option value="mba">MBA</option>
                            <option value="mestrado">Mestrado</option>
                            <option value="doutorado">Doutorado</option>
                          </select>
                        </div>
                        <div>
                          <label className="flex items-center mt-6">
                            <input
                              type="checkbox"
                              checked={posGraduacaoConfig.obrigatorio}
                              onChange={(e) => setPosGraduacaoConfig(prev => ({ ...prev, obrigatorio: e.target.checked }))}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Obrigatório</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. HISTÓRICO PROFISSIONAL */}
              <div className="border border-orange-200 rounded-lg p-6 bg-orange-50">
                <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                  <Clock size={18} className="mr-2" />
                  Histórico Profissional
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={experienceRequirements.tempo_total_experiencia}
                      onChange={(e) => setExperienceRequirements(prev => ({ ...prev, tempo_total_experiencia: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Tempo total de experiência</span>
                      <p className="text-sm text-gray-600">Anos de experiência profissional total</p>
                    </div>
                  </label>
                  
                  {experienceRequirements.tempo_total_experiencia && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-orange-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tempo mínimo (anos)</label>
                          <input
                            type="number"
                            value={tempoTotalConfig.minimo}
                            onChange={(e) => setTempoTotalConfig(prev => ({ ...prev, minimo: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tempo preferencial (anos)</label>
                          <input
                            type="number"
                            value={tempoTotalConfig.preferencial}
                            onChange={(e) => setTempoTotalConfig(prev => ({ ...prev, preferencial: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="5"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={experienceRequirements.tempo_funcao_especifica}
                      onChange={(e) => setExperienceRequirements(prev => ({ ...prev, tempo_funcao_especifica: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Tempo em função específica</span>
                      <p className="text-sm text-gray-600">Experiência na função exata da vaga</p>
                    </div>
                  </label>
                  
                  {experienceRequirements.tempo_funcao_especifica && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-orange-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Função/Cargo</label>
                          <input
                            type="text"
                            value={tempoFuncaoConfig.funcao}
                            onChange={(e) => setTempoFuncaoConfig(prev => ({ ...prev, funcao: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Ex: Vendedor, Analista, Gerente..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tempo mínimo (anos)</label>
                          <input
                            type="number"
                            value={tempoFuncaoConfig.tempo_minimo}
                            onChange={(e) => setTempoFuncaoConfig(prev => ({ ...prev, tempo_minimo: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={experienceRequirements.experiencia_setor}
                      onChange={(e) => setExperienceRequirements(prev => ({ ...prev, experiencia_setor: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Experiência em setor específico</span>
                      <p className="text-sm text-gray-600">Conhecimento do segmento/indústria</p>
                    </div>
                  </label>
                  
                  {experienceRequirements.experiencia_setor && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setExperienciaSetorConfig(prev => [...prev, ''])}
                          className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                        >
                          + Adicionar Setor
                        </button>
                      </div>
                      {experienciaSetorConfig.map((setor, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={setor}
                            onChange={(e) => {
                              const newSetores = [...experienciaSetorConfig];
                              newSetores[index] = e.target.value;
                              setExperienciaSetorConfig(newSetores);
                            }}
                            placeholder="Ex: Varejo, Tecnologia, Saúde, Financeiro..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setExperienciaSetorConfig(prev => prev.filter((_, i) => i !== index))}
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={experienceRequirements.porte_empresa}
                      onChange={(e) => setExperienceRequirements(prev => ({ ...prev, porte_empresa: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Porte de empresa</span>
                      <p className="text-sm text-gray-600">Tamanho das empresas onde trabalhou</p>
                    </div>
                  </label>
                  
                  {experienceRequirements.porte_empresa && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-orange-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar portes aceitos</label>
                      <div className="space-y-2">
                        {['Microempresa (até 9 funcionários)', 'Pequena empresa (10-49 funcionários)', 'Média empresa (50-499 funcionários)', 'Grande empresa (500+ funcionários)', 'Multinacional'].map(porte => (
                          <label key={porte} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={porteEmpresaConfig.includes(porte)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPorteEmpresaConfig(prev => [...prev, porte]);
                                } else {
                                  setPorteEmpresaConfig(prev => prev.filter(p => p !== porte));
                                }
                              }}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="ml-2 text-sm">{porte}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={experienceRequirements.cargos_lideranca}
                      onChange={(e) => setExperienceRequirements(prev => ({ ...prev, cargos_lideranca: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Cargos de liderança</span>
                      <p className="text-sm text-gray-600">Experiência em gestão de equipes</p>
                    </div>
                  </label>
                  
                  {experienceRequirements.cargos_lideranca && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-orange-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho da equipe (pessoas)</label>
                          <input
                            type="number"
                            value={liderancaConfig.tamanho_equipe}
                            onChange={(e) => setLiderancaConfig(prev => ({ ...prev, tamanho_equipe: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="5"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nível de liderança</label>
                          <select
                            value={liderancaConfig.nivel}
                            onChange={(e) => setLiderancaConfig(prev => ({ ...prev, nivel: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Selecionar</option>
                            <option value="coordenacao">Coordenação</option>
                            <option value="supervisao">Supervisão</option>
                            <option value="gerencia">Gerência</option>
                            <option value="diretoria">Diretoria</option>
                            <option value="presidencia">Presidência/C-Level</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. HABILIDADES TÉCNICAS */}
              <div className="border border-indigo-200 rounded-lg p-6 bg-indigo-50">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                  <Building2 size={18} className="mr-2" />
                  Habilidades Técnicas
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={technicalRequirements.tecnologias_softwares}
                      onChange={(e) => setTechnicalRequirements(prev => ({ ...prev, tecnologias_softwares: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Tecnologias / Softwares</span>
                      <p className="text-sm text-gray-600">Ferramentas técnicas específicas</p>
                    </div>
                  </label>
                  
                  {technicalRequirements.tecnologias_softwares && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={addTecnologia}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                        >
                          + Adicionar Tecnologia
                        </button>
                      </div>
                      {tecnologiasConfig.map((tech, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                          <input
                            type="text"
                            value={tech.nome}
                            onChange={(e) => {
                              const newTechs = [...tecnologiasConfig];
                              newTechs[index].nome = e.target.value;
                              setTecnologiasConfig(newTechs);
                            }}
                            placeholder="Ex: Excel, SAP, JavaScript..."
                            className="col-span-6 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          <select
                            value={tech.nivel}
                            onChange={(e) => {
                              const newTechs = [...tecnologiasConfig];
                              newTechs[index].nivel = e.target.value;
                              setTecnologiasConfig(newTechs);
                            }}
                            className="col-span-3 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="basico">Básico</option>
                            <option value="intermediario">Intermediário</option>
                            <option value="avancado">Avançado</option>
                            <option value="expert">Expert</option>
                          </select>
                          <label className="col-span-2 flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={tech.obrigatorio}
                              onChange={(e) => {
                                const newTechs = [...tecnologiasConfig];
                                newTechs[index].obrigatorio = e.target.checked;
                                setTecnologiasConfig(newTechs);
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-1 text-xs">Obrig.</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeTecnologia(index)}
                            className="col-span-1 px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={technicalRequirements.idiomas}
                      onChange={(e) => setTechnicalRequirements(prev => ({ ...prev, idiomas: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Idiomas</span>
                      <p className="text-sm text-gray-600">Fluência em idiomas estrangeiros</p>
                    </div>
                  </label>
                  
                  {technicalRequirements.idiomas && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={addIdioma}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                        >
                          + Adicionar Idioma
                        </button>
                      </div>
                      {idiomasConfig.map((idioma, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                          <select
                            value={idioma.idioma}
                            onChange={(e) => {
                              const newIdiomas = [...idiomasConfig];
                              newIdiomas[index].idioma = e.target.value;
                              setIdiomasConfig(newIdiomas);
                            }}
                            className="col-span-6 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Selecionar idioma</option>
                            <option value="ingles">Inglês</option>
                            <option value="espanhol">Espanhol</option>
                            <option value="frances">Francês</option>
                            <option value="alemao">Alemão</option>
                            <option value="italiano">Italiano</option>
                            <option value="chines">Chinês</option>
                            <option value="japones">Japonês</option>
                            <option value="coreano">Coreano</option>
                            <option value="russo">Russo</option>
                            <option value="arabe">Árabe</option>
                          </select>
                          <select
                            value={idioma.nivel}
                            onChange={(e) => {
                              const newIdiomas = [...idiomasConfig];
                              newIdiomas[index].nivel = e.target.value;
                              setIdiomasConfig(newIdiomas);
                            }}
                            className="col-span-3 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="basico">Básico</option>
                            <option value="intermediario">Intermediário</option>
                            <option value="avancado">Avançado</option>
                            <option value="fluente">Fluente</option>
                            <option value="nativo">Nativo</option>
                          </select>
                          <label className="col-span-2 flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={idioma.obrigatorio}
                              onChange={(e) => {
                                const newIdiomas = [...idiomasConfig];
                                newIdiomas[index].obrigatorio = e.target.checked;
                                setIdiomasConfig(newIdiomas);
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-1 text-xs">Obrig.</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeIdioma(index)}
                            className="col-span-1 px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={technicalRequirements.certificacoes_tecnicas}
                      onChange={(e) => setTechnicalRequirements(prev => ({ ...prev, certificacoes_tecnicas: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Certificações técnicas</span>
                      <p className="text-sm text-gray-600">Certificados profissionais específicos</p>
                    </div>
                  </label>
                  
                  {technicalRequirements.certificacoes_tecnicas && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={addCertificacao}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                        >
                          + Adicionar Certificação
                        </button>
                      </div>
                      {certificacoesConfig.map((cert, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                          <input
                            type="text"
                            value={cert.nome}
                            onChange={(e) => {
                              const newCerts = [...certificacoesConfig];
                              newCerts[index].nome = e.target.value;
                              setCertificacoesConfig(newCerts);
                            }}
                            placeholder="Ex: PMP, CISSP, AWS Certified..."
                            className="col-span-9 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          <label className="col-span-2 flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={cert.obrigatorio}
                              onChange={(e) => {
                                const newCerts = [...certificacoesConfig];
                                newCerts[index].obrigatorio = e.target.checked;
                                setCertificacoesConfig(newCerts);
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-1 text-xs">Obrig.</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeCertificacao(index)}
                            className="col-span-1 px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={technicalRequirements.registros_profissionais}
                      onChange={(e) => setTechnicalRequirements(prev => ({ ...prev, registros_profissionais: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Registros profissionais</span>
                      <p className="text-sm text-gray-600">CRM, OAB, CREA, CRC, etc.</p>
                    </div>
                  </label>
                  
                  {technicalRequirements.registros_profissionais && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setRegistrosConfig(prev => [...prev, ''])}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                        >
                          + Adicionar Registro
                        </button>
                      </div>
                      {registrosConfig.map((registro, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <select
                            value={registro}
                            onChange={(e) => {
                              const newRegistros = [...registrosConfig];
                              newRegistros[index] = e.target.value;
                              setRegistrosConfig(newRegistros);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Selecionar registro</option>
                            <option value="CRM">CRM - Conselho Regional de Medicina</option>
                            <option value="OAB">OAB - Ordem dos Advogados do Brasil</option>
                            <option value="CREA">CREA - Conselho Regional de Engenharia</option>
                            <option value="CRC">CRC - Conselho Regional de Contabilidade</option>
                            <option value="CRO">CRO - Conselho Regional de Odontologia</option>
                            <option value="CRF">CRF - Conselho Regional de Farmácia</option>
                            <option value="CRP">CRP - Conselho Regional de Psicologia</option>
                            <option value="CRN">CRN - Conselho Regional de Nutrição</option>
                            <option value="COREN">COREN - Conselho Regional de Enfermagem</option>
                            <option value="CAU">CAU - Conselho de Arquitetura e Urbanismo</option>
                            <option value="outros">Outros (especificar)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setRegistrosConfig(prev => prev.filter((_, i) => i !== index))}
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 6. SOFT SKILLS (EXTRAS OPCIONAIS) */}
              <div className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                  <Check size={18} className="mr-2" />
                  ⚠️ Extras opcionais (peso baixo)
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={softSkillsRequirements.soft_skills}
                      onChange={(e) => setSoftSkillsRequirements(prev => ({ ...prev, soft_skills: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Soft skills declaradas no CV</span>
                      <p className="text-sm text-gray-600">Ex: liderança, comunicação, trabalho em equipe</p>
                      <p className="text-xs text-yellow-700 mt-1">⚠️ Peso baixo no scoring - apenas complementar</p>
                    </div>
                  </label>
                  
                  {softSkillsRequirements.soft_skills && (
                    <div className="ml-6 p-4 bg-white rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={addSoftSkill}
                          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                        >
                          + Adicionar Soft Skill
                        </button>
                      </div>
                      {softSkillsConfig.map((skill, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={skill}
                            onChange={(e) => {
                              const newSkills = [...softSkillsConfig];
                              newSkills[index] = e.target.value;
                              setSoftSkillsConfig(newSkills);
                            }}
                            placeholder="Ex: Liderança, Comunicação, Proatividade..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeSoftSkill(index)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <X size={16} className="inline mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !jobTitle.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              <Save size={16} className="inline mr-2" />
              {isSubmitting ? 'Criando...' : 'Criar Triagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewScreeningChecklistPage;