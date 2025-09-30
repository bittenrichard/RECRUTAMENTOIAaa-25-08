const API_BASE_URL = 'http://localhost:3001';

async function testModoTrabalhoSaving() {
  console.log('🧪 TESTE ESPECÍFICO: Salvamento do modo_trabalho...');
  
  const testData = {
    titulo: 'TESTE MODO TRABALHO FINAL - ' + Date.now(),
    descricao: 'Teste final do modo de trabalho',
    endereco: 'São Paulo, SP', 
    modo_trabalho: 'híbrido', // IMPORTANTE: Este campo deve ser salvo
    requisitos_json: JSON.stringify({
      idade: { min: '20', max: '50' },
      teste: 'dados existentes'
    }),
    usuario: [1]
  };

  console.log('📤 Enviando dados específicos:');
  console.log('- Título:', testData.titulo);
  console.log('- Modo trabalho:', testData.modo_trabalho);
  console.log('- Requisitos JSON original:', testData.requisitos_json);

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('\n✅ Vaga criada:');
    console.log('- ID:', result.id);
    console.log('- Requisitos JSON retornado:', result.requisitos_json);
    
    // Parse do JSON retornado
    if (result.requisitos_json) {
      try {
        const parsed = JSON.parse(result.requisitos_json);
        console.log('- Conteúdo parseado:', JSON.stringify(parsed, null, 2));
        console.log('- modo_trabalho no JSON:', parsed.modo_trabalho);
        
        if (parsed.modo_trabalho === 'híbrido') {
          console.log('🎉 SUCESSO: modo_trabalho foi salvo no JSON!');
        } else {
          console.log('❌ ERRO: modo_trabalho não foi salvo no JSON');
        }
      } catch (error) {
        console.log('❌ Erro ao parsear JSON retornado:', error.message);
      }
    }
    
    // Aguardar e verificar no endpoint de dados
    console.log('\n⏳ Aguardando 3 segundos para verificar dados...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dataResponse = await fetch(`${API_BASE_URL}/api/data/all/1`);
    if (dataResponse.ok) {
      const data = await dataResponse.json();
      const createdJob = data.jobs.find(job => job.id === result.id);
      if (createdJob) {
        console.log('📋 Verificação no /api/data/all:');
        console.log('- Modo trabalho na propriedade:', createdJob.modo_trabalho);
        console.log('- Requisitos JSON:', createdJob.requisitos_json);
        
        if (createdJob.requisitos_json) {
          try {
            const parsed = JSON.parse(createdJob.requisitos_json);
            console.log('- modo_trabalho extraído:', parsed.modo_trabalho);
          } catch (error) {
            console.log('❌ Erro ao parsear:', error.message);
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erro:', error);
    return null;
  }
}

testModoTrabalhoSaving().catch(console.error);