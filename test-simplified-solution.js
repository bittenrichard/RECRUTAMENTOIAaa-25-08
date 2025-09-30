const API_BASE_URL = 'http://localhost:3001';

async function testSimplifiedSolution() {
  console.log('🧪 TESTE: Solução simplificada com modo_trabalho na descrição...');
  
  const testData = {
    titulo: 'TESTE SOLUÇÃO SIMPLES - ' + Date.now(),
    descricao: 'Esta é uma vaga de teste',
    endereco: 'São Paulo, SP',
    modo_trabalho: 'remoto',
    requisitos_json: JSON.stringify({
      idade: { min: '22', max: '45' }
    }),
    usuario: [1]
  };

  console.log('📤 Dados para teste:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      console.log('❌ Status:', response.status);
      const errorText = await response.text();
      console.log('❌ Erro:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Vaga criada:');
    console.log('- ID:', result.id);
    console.log('- Descrição retornada:', result.descricao);
    
    // Verificar se a descrição contém o modo de trabalho
    if (result.descricao && result.descricao.includes('[MODO: remoto]')) {
      console.log('🎉 SUCESSO! modo_trabalho foi salvo na descrição!');
    } else {
      console.log('❌ ERRO: modo_trabalho não foi salvo na descrição');
    }
    
    // Aguardar e verificar no endpoint de dados
    console.log('\n⏳ Aguardando 2 segundos para verificar dados...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dataResponse = await fetch(`${API_BASE_URL}/api/data/all/1`);
    if (dataResponse.ok) {
      const data = await dataResponse.json();
      const createdJob = data.jobs.find(job => job.id === result.id);
      if (createdJob) {
        console.log('📋 Verificação no /api/data/all:');
        console.log('- Modo trabalho extraído:', createdJob.modo_trabalho);
        console.log('- Descrição limpa:', createdJob.descricao);
        
        if (createdJob.modo_trabalho === 'remoto') {
          console.log('🎉 PERFEITO! modo_trabalho foi extraído corretamente!');
        } else {
          console.log('❌ ERRO: modo_trabalho não foi extraído da descrição');
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erro:', error);
    return null;
  }
}

testSimplifiedSolution();