// Teste simples de conexão com o servidor
const http = require('http');

function testConnection() {
  console.log('🔗 Testando conexão com o servidor...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/health',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Servidor respondendo:', JSON.parse(data));
      } else {
        console.log('❌ Erro de resposta:', res.statusCode, data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('💥 Erro de conexão:', error.message);
  });

  req.end();
}

testConnection();