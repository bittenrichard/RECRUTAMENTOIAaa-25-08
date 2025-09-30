const fetch = require('node-fetch');

async function testProvaseAplicadas() {
  console.log('🔍 Testando tabela de provas aplicadas diretamente...\n');
  
  try {
    // Testar endpoint interno para listar provas aplicadas
    console.log('📋 Buscando todas as provas aplicadas...');
    const response = await fetch('http://localhost:3001/api/debug/provas-aplicadas', {
      method: 'GET',
      headers: {
        'x-user-id': '2',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`❌ Erro HTTP: ${response.status}`);
      const errorText = await response.text();
      console.log('Erro:', errorText);
      return;
    }

    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Total de provas encontradas: ${data.total || 0}`);
    
    if (data.data && data.data.length > 0) {
      console.log('\n📄 Primeiras 5 provas aplicadas:');
      data.data.slice(0, 5).forEach((prova, index) => {
        console.log(`  ${index + 1}. ID: ${prova.id}, Candidato: ${JSON.stringify(prova.candidato)}, Status: ${prova.status}`);
      });
    } else {
      console.log('❌ Nenhuma prova aplicada encontrada');
    }

  } catch (error) {
    console.error('❌ Erro ao buscar provas aplicadas:', error.message);
  }
}

testProvaseAplicadas();