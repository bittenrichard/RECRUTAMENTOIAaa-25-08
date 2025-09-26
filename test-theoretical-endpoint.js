import fetch from 'node-fetch';

async function testTheoreticalEndpoint() {
  try {
    // Primeiro, vamos buscar os modelos disponíveis
    console.log('Buscando modelos de prova teórica...');
    const modelsResponse = await fetch('http://localhost:3001/api/theoretical-models', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const modelsData = await modelsResponse.json();
    console.log('Resposta dos modelos:', JSON.stringify(modelsData, null, 2));
    
    if (modelsData.success && modelsData.data && modelsData.data.length > 0) {
      const firstModel = modelsData.data[0];
      console.log('Primeiro modelo encontrado:', firstModel);
      
      // Agora vamos tentar gerar uma prova com dados de teste
      console.log('\nTentando gerar prova teórica...');
      const generateResponse = await fetch('http://localhost:3001/api/theoretical-test/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidato_id: '1', // ID de teste
          modelo_prova_id: '20' // Usando modelo ativo
        })
      });
      
      const generateData = await generateResponse.json();
      console.log('Status da resposta:', generateResponse.status);
      console.log('Resposta da geração:', JSON.stringify(generateData, null, 2));
    } else {
      console.log('Nenhum modelo de prova encontrado ou erro na resposta');
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testTheoreticalEndpoint();