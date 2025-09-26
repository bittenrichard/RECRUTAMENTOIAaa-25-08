// Teste simples de conectividade
import http from 'http';

function testarServidor() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Resposta:', data);
      testarModelos();
    });
  });

  req.on('error', (e) => {
    console.error(`Erro na requisição: ${e.message}`);
  });

  req.end();
}

function testarModelos() {
  console.log('\n🧪 Testando modelos de provas...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/theoretical-models',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status modelos: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('✅ Resposta modelos:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('❌ Erro ao parsing:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Erro na requisição modelos: ${e.message}`);
  });

  req.end();
}

testarServidor();