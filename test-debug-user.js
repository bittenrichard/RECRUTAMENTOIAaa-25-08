// Teste do endpoint de debug do usuário
import http from 'http';

console.log('🔍 Testando endpoint de debug do usuário...');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/google/auth/debug/1',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Debug Info:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Resposta raw:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro na requisição: ${e.message}`);
});

req.setTimeout(15000);
req.end();