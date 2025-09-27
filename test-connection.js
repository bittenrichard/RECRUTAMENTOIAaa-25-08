// Teste de conexão básica
import fetch from 'node-fetch';

async function testConnection() {
  try {
    console.log('🔗 Testando conexão básica...');
    
    const response = await fetch('http://localhost:3001/', {
      method: 'GET',
    });
    
    console.log(`📡 Status: ${response.status}`);
    const text = await response.text();
    console.log('📋 Response:', text);
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  }
}

testConnection();