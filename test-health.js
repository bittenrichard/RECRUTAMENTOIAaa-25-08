// Teste básico de conectividade do servidor
import http from 'http';

console.log('🔍 Testando conectividade básica do servidor...');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/health',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response Body:', data);
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro na requisição: ${e.message}`);
});

req.setTimeout(5000);
req.end();