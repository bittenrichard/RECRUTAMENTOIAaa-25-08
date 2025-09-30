const fetch = require('node-fetch');

async function testBaserowFiltering() {
  console.log('🧪 Testando filtros da API Baserow...\n');

  // Substitua pela sua API key do Baserow
  const BASEROW_API_KEY = process.env.VITE_BASEROW_API_KEY;
  const PROVAS_TEORICAS_APLICADAS_TABLE_ID = '384949';

  const baserowHeaders = {
    'Authorization': `Token ${BASEROW_API_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    // Teste 1: Buscar todas as provas sem filtro
    console.log('📋 Teste 1: Todas as provas (sem filtro)');
    const allResponse = await fetch(`https://api.baserow.io/api/database/rows/table/${PROVAS_TEORICAS_APLICADAS_TABLE_ID}/`, {
      headers: baserowHeaders
    });
    const allData = await allResponse.json();
    console.log(`Total de provas: ${allData.results?.length || 0}`);
    
    // Mostrar os primeiros 5 registros para entender a estrutura
    if (allData.results && allData.results.length > 0) {
      console.log('Primeiras 5 provas:');
      allData.results.slice(0, 5).forEach((prova, index) => {
        console.log(`  ${index + 1}. ID: ${prova.id}, Candidato: ${prova.candidato}, Recrutador: ${JSON.stringify(prova.recrutador)}`);
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Teste 2: Buscar provas do candidato 203
    console.log('📋 Teste 2: Provas do candidato 203');
    const candidate203Response = await fetch(`https://api.baserow.io/api/database/rows/table/${PROVAS_TEORICAS_APLICADAS_TABLE_ID}/?filter__candidato=203`, {
      headers: baserowHeaders
    });
    const candidate203Data = await candidate203Response.json();
    console.log(`Provas do candidato 203: ${candidate203Data.results?.length || 0}`);
    if (candidate203Data.results) {
      candidate203Data.results.forEach((prova, index) => {
        console.log(`  ${index + 1}. ID: ${prova.id}, Candidato: ${prova.candidato}, Recrutador: ${JSON.stringify(prova.recrutador)}`);
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Teste 3: Buscar provas do candidato 204
    console.log('📋 Teste 3: Provas do candidato 204');
    const candidate204Response = await fetch(`https://api.baserow.io/api/database/rows/table/${PROVAS_TEORICAS_APLICADAS_TABLE_ID}/?filter__candidato=204`, {
      headers: baserowHeaders
    });
    const candidate204Data = await candidate204Response.json();
    console.log(`Provas do candidato 204: ${candidate204Data.results?.length || 0}`);
    if (candidate204Data.results) {
      candidate204Data.results.forEach((prova, index) => {
        console.log(`  ${index + 1}. ID: ${prova.id}, Candidato: ${prova.candidato}, Recrutador: ${JSON.stringify(prova.recrutador)}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testBaserowFiltering();