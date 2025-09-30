const fetch = require('node-fetch');

// Testar diretamente com a API do Baserow
async function testBaserowConnection() {
  console.log('🔍 Testando conexão direta com Baserow...\n');
  
  const BASEROW_API_KEY = process.env.VITE_BASEROW_API_KEY;
  const PROVAS_TEORICAS_APLICADAS_TABLE_ID = '730';
  
  console.log('🔑 BASEROW_API_KEY:', BASEROW_API_KEY ? `${BASEROW_API_KEY.substring(0, 10)}...` : 'NÃO ENCONTRADA');
  
  if (!BASEROW_API_KEY) {
    console.error('❌ VITE_BASEROW_API_KEY não encontrada');
    return;
  }
  
  try {
    // Testar acesso direto à tabela de provas aplicadas
    const url = `https://api.baserow.io/api/database/rows/table/${PROVAS_TEORICAS_APLICADAS_TABLE_ID}/`;
    console.log(`📡 URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${BASEROW_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', errorText);
      return;
    }

    const data = await response.json();
    console.log(`✅ Total de provas na tabela: ${data.results?.length || 0}`);
    
    if (data.results && data.results.length > 0) {
      console.log('\n📄 Primeiras 3 provas:');
      data.results.slice(0, 3).forEach((prova, index) => {
        console.log(`  ${index + 1}. ID: ${prova.id}, Candidato: ${JSON.stringify(prova.candidato)}, Status: ${prova.status}`);
      });
    } else {
      console.log('❌ Nenhuma prova encontrada na tabela');
    }

  } catch (error) {
    console.error('❌ Erro ao conectar com Baserow:', error.message);
  }
}

testBaserowConnection();