const fetch = require('node-fetch');

async function testSpecificCandidate() {
  console.log('🧪 Testando endpoints para candidatos específicos...\n');

  const candidates = [203, 204];

  for (const candidateId of candidates) {
    console.log(`\n📋 Testando candidato ${candidateId}:`);
    
    try {
      const response = await fetch(`http://localhost:3001/api/theoretical-test/results/${candidateId}`, {
        method: 'GET',
        headers: {
          'x-user-id': '2',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Provas encontradas: ${data.data?.length || 0}`);
      
      if (data.data && data.data.length > 0) {
        console.log('📄 Primeiras provas:');
        data.data.slice(0, 3).forEach((prova, index) => {
          console.log(`  ${index + 1}. ID: ${prova.id}, Modelo: ${prova.modelo_nome}, Status: ${prova.status}`);
        });
      }

    } catch (error) {
      console.error(`❌ Erro para candidato ${candidateId}:`, error.message);
    }
  }
}

testSpecificCandidate();