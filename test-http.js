import http from 'http';

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, data: JSON.parse(data) });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('🔍 Testando com HTTP nativo...\n');
  
  try {
    console.log('1️⃣ Testando /api/test');
    const testResult = await testEndpoint('/api/test');
    console.log('✅ Status:', testResult.status);
    console.log('✅ Resposta:', testResult.data);
    
    console.log('\n2️⃣ Testando /api/theoretical-models');
    const modelsResult = await testEndpoint('/api/theoretical-models');
    console.log('✅ Status:', modelsResult.status);
    console.log('✅ Modelos encontrados:', modelsResult.data.data?.length || 0);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

runTests();