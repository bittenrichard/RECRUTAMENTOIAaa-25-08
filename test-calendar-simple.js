// Teste simples do endpoint de Google Calendar
import http from 'http';

console.log('🧪 Iniciando teste do endpoint Google Calendar...');

// Fazer requisição para o endpoint
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/google/calendar/events/1',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response Body:');
    console.log(data);
    
    try {
      const parsed = JSON.parse(data);
      console.log('✅ JSON válido:', parsed);
    } catch (e) {
      console.log('⚠️  Resposta não é JSON válido');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro na requisição: ${e.message}`);
});

req.on('timeout', () => {
  console.error('⏰ Timeout na requisição');
  req.destroy();
});

req.setTimeout(10000); // 10 segundos timeout
req.end();