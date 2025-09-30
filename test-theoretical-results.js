// Teste para verificar o endpoint de resultados de provas teóricas

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function testTheoreticalResults(candidateId, userId = '1') {
  try {
    console.log(`🔍 Testando endpoint: ${API_BASE_URL}/api/theoretical-test/results/${candidateId}`);
    console.log(`👤 User ID: ${userId}`);
    
    const response = await fetch(`${API_BASE_URL}/api/theoretical-test/results/${candidateId}`, {
      headers: {
        'x-user-id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status da resposta: ${response.status}`);
    console.log(`✅ Response OK: ${response.ok}`);
    
    const data = await response.json();
    console.log('📋 Dados retornados:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data && data.data.length > 0) {
      console.log('🎯 Resultados encontrados:');
      data.data.forEach((result, index) => {
        console.log(`  ${index + 1}. ID: ${result.id}, Status: ${result.status}, Pontuação: ${result.pontuacao_total}`);
      });
    } else {
      console.log('❌ Nenhum resultado encontrado ou resposta de erro');
    }
    
  } catch (error) {
    console.error('🚨 Erro na requisição:', error);
  }
}

// Teste com um ID de candidato (substituir pelo ID real)
const candidateId = process.argv[2] || '1';
const userId = process.argv[3] || '1';

console.log('🚀 Iniciando teste do endpoint de resultados de provas teóricas...');
testTheoreticalResults(candidateId, userId);