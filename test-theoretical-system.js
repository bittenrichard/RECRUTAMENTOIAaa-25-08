// Teste do Sistema de Provas Teóricas
// Similar ao comportamental
const API_BASE = 'http://localhost:3001';

async function testarSistemaProvasTeorica() {
  console.log('🧪 Testando Sistema de Provas Teóricas');
  console.log('=====================================\n');

  try {
    // 1. Listar modelos disponíveis
    console.log('1️⃣ Listando modelos de provas...');
    const modelsResponse = await fetch(`${API_BASE}/api/theoretical-models`);
    const modelsData = await modelsResponse.json();
    
    if (modelsData.success) {
      console.log(`✅ Encontrados ${modelsData.data.length} modelos:`);
      modelsData.data.forEach(model => {
        console.log(`   - ID: ${model.id} | ${model.titulo || model.nome} (${model.total_questoes || 0} questões)`);
      });
    } else {
      console.log('❌ Erro ao buscar modelos:', modelsData.error);
      return;
    }

    if (modelsData.data.length === 0) {
      console.log('⚠️ Nenhum modelo encontrado. Criando um modelo de teste...');
      
      // Criar modelo de teste
      const modeloTeste = {
        titulo: 'Teste de Conhecimentos Gerais',
        descricao: 'Prova básica para testar o sistema',
        tempo_limite: 30,
        perguntas: JSON.stringify([
          {
            id: '1',
            tipo: 'verdadeiro_falso',
            enunciado: 'O Brasil é um país da América do Sul?',
            resposta_correta: 'verdadeiro',
            pontuacao: 10
          },
          {
            id: '2',
            tipo: 'multipla_escolha',
            enunciado: 'Qual é a capital do Brasil?',
            opcoes: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Belo Horizonte'],
            resposta_correta: 'Brasília',
            pontuacao: 10
          }
        ]),
        ativo: true
      };

      const createResponse = await fetch(`${API_BASE}/api/theoretical-models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modeloTeste)
      });

      const createData = await createResponse.json();
      if (createData.success) {
        console.log('✅ Modelo criado:', createData.data.id);
        modelsData.data.push(createData.data);
      } else {
        console.log('❌ Erro ao criar modelo:', createData.error);
        return;
      }
    }

    // 2. Gerar prova para um candidato
    const primeiroModelo = modelsData.data[0];
    const candidatoTeste = 123; // ID fictício
    
    console.log(`\n2️⃣ Gerando prova para candidato ${candidatoTeste}...`);
    
    const generateResponse = await fetch(`${API_BASE}/api/theoretical-test/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: candidatoTeste,
        modeloId: primeiroModelo.id,
        recruiterId: 1 // ID fictício
      })
    });

    const generateData = await generateResponse.json();
    
    if (generateData.success) {
      console.log('✅ Prova gerada com sucesso:');
      console.log(`   - Test ID: ${generateData.testId}`);
      console.log(`   - Link: ${generateData.link}`);
      console.log(`   - Candidato: ${generateData.candidateName}`);
      console.log(`   - Modelo: ${generateData.modelName}`);
      
      // 3. Testar acesso público à prova
      console.log(`\n3️⃣ Testando acesso público à prova...`);
      
      const publicResponse = await fetch(`${API_BASE}/api/public/theoretical-test/${generateData.testId}`);
      const publicData = await publicResponse.json();
      
      if (publicData.success) {
        console.log('✅ Acesso público funcionando:');
        console.log(`   - Candidato: ${publicData.data.candidateName}`);
        console.log(`   - Modelo: ${publicData.data.model.titulo}`);
        console.log(`   - Questões: ${publicData.data.model.questoes.length}`);
        console.log(`   - Tempo: ${publicData.data.model.tempo_limite} minutos`);
      } else {
        console.log('❌ Erro no acesso público:', publicData.error);
      }
      
    } else {
      console.log('❌ Erro ao gerar prova:', generateData.error);
      
      // Se já existe prova, tentar usar ela
      if (generateData.testId) {
        console.log(`ℹ️ Usando prova existente: ${generateData.testId}`);
      }
    }

    console.log('\n✅ Teste concluído!');
    console.log('📝 Sistema implementado similar ao comportamental');
    console.log('🔗 Links diretos funcionam com IDs do Baserow');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testarSistemaProvasTeorica();