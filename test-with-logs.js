const API_BASE_URL = 'http://localhost:3001';

async function testWithLogs() {
  console.log('🔍 Teste para forçar logs do servidor...');
  
  const testData = {
    titulo: 'FORÇAR LOGS - ' + Date.now(),
    descricao: 'Vaga para verificar logs',
    endereco: 'Test Location',
    modo_trabalho: 'presencial', // Mudando para presencial
    requisitos_json: JSON.stringify({
      idade: { min: '18', max: '65' }
    }),
    usuario: [1]
  };

  console.log('📤 Dados sendo enviados:', JSON.stringify(testData, null, 2));
  console.log('👀 Verifique os logs do servidor agora...');

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    console.log('📨 Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erro:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Resposta recebida:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

testWithLogs();