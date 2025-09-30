const API_BASE_URL = 'http://localhost:3001';

async function testWorkModeDetailedCreate() {
  console.log('🧪 TESTE DETALHADO: Criação de vaga com modo_trabalho...');
  
  const testData = {
    titulo: 'DEBUG Modalidade - ' + Date.now(),
    descricao: 'Vaga para debug do campo modo_trabalho',
    endereco: 'Remote Work',
    modo_trabalho: 'remoto',
    requisitos_json: JSON.stringify({
      idade: { min: '25', max: '45' }
    }),
    usuario: [1]
  };

  console.log('📤 Enviando dados:', JSON.stringify(testData, null, 2));

  try {
    console.log('🔄 Fazendo requisição POST...');
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    console.log('📨 Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Resposta de erro:', errorText);
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Vaga criada - resposta completa:');
    console.log(JSON.stringify(result, null, 2));
    
    // Aguardar um pouco e buscar a vaga criada
    console.log('\n⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Buscando dados atualizados...');
    const dataResponse = await fetch(`${API_BASE_URL}/api/data/all/1`);
    if (dataResponse.ok) {
      const data = await dataResponse.json();
      const createdJob = data.jobs.find(job => job.id === result.id);
      if (createdJob) {
        console.log('📋 Vaga encontrada nos dados:');
        console.log('- ID:', createdJob.id);
        console.log('- Título:', createdJob.titulo);
        console.log('- Modo Trabalho:', createdJob.modo_trabalho);
        console.log('- Endereco:', createdJob.Endereco || createdJob.endereco);
        console.log('- Todas as propriedades:', Object.keys(createdJob));
      } else {
        console.log('❓ Vaga não encontrada nos dados retornados');
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao criar vaga:', error);
    return null;
  }
}

testWorkModeDetailedCreate().catch(console.error);