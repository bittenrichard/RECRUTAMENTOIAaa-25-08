// Teste manual do endpoint de Google Calendar
import http from 'http';

console.log('🔍 Testando endpoint Google Calendar manualmente...');

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
      if (parsed.events && Array.isArray(parsed.events)) {
        console.log(`✅ ${parsed.events.length} eventos encontrados:`);
        parsed.events.forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.title || event.summary} (${event.start} - ${event.end})`);
        });
      } else {
        console.log('⚠️  Formato de resposta inesperado');
      }
    } catch (e) {
      console.log('⚠️  Resposta não é JSON válido');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro na requisição: ${e.message}`);
});

req.setTimeout(15000);
req.end();