import fetch from 'node-fetch';

async function testCandidatesEndpoint() {
  try {
    console.log('Buscando candidatos existentes...');
    const candidatesResponse = await fetch('https://backend.recrutamentoia.com.br/api/data/all/1', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!candidatesResponse.ok) {
      console.error('Erro ao buscar candidatos:', candidatesResponse.status);
      return;
    }
    
    const candidatesData = await candidatesResponse.json();
    console.log('Estrutura da resposta:', JSON.stringify(candidatesData, null, 2));
    
    const candidates = candidatesData.data?.candidates || [];
    
    if (candidates.length > 0) {
      console.log('Primeiros 3 candidatos:');
      candidates.slice(0, 3).forEach((candidate, index) => {
        console.log(`${index + 1}. ID: ${candidate.id}, Nome: ${candidate.nome}`);
      });
      
      const firstCandidate = candidates[0];
      console.log(`\nUsando candidato: ${firstCandidate.nome} (ID: ${firstCandidate.id})`);
      
      // Agora testar com um candidato real
      console.log('Tentando gerar prova teórica...');
      const generateResponse = await fetch('https://backend.recrutamentoia.com.br/api/theoretical-test/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidato_id: firstCandidate.id.toString(),
          modelo_prova_id: '20' // Modelo ativo
        })
      });
      
      const generateData = await generateResponse.json();
      console.log('Status da resposta:', generateResponse.status);
      console.log('Resposta da geração:', JSON.stringify(generateData, null, 2));
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testCandidatesEndpoint();