// Teste simples de conectividade e modo_trabalho
const http = require('http');

function testHealth() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Servidor conectado!');
        resolve(JSON.parse(data));
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Erro de conectividade:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

function testCreateJob() {
  return new Promise((resolve, reject) => {
    const testData = JSON.stringify({
      titulo: 'TESTE MODO TRABALHO - ' + Date.now(),
      descricao: 'Teste simples',
      endereco: 'São Paulo, SP',
      modo_trabalho: 'remoto',
      requisitos_json: JSON.stringify({ idade: { min: '20', max: '40' } }),
      usuario: [1]
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/jobs',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📤 Response status: ${res.statusCode}`);
        if (res.statusCode === 200 || res.statusCode === 201) {
          const result = JSON.parse(data);
          console.log('✅ Vaga criada:', result.id);
          console.log('📄 requisitos_json:', result.requisitos_json);
          
          if (result.requisitos_json) {
            const parsed = JSON.parse(result.requisitos_json);
            console.log('🔍 modo_trabalho salvo:', parsed.modo_trabalho);
            
            if (parsed.modo_trabalho === 'remoto') {
              console.log('🎉 SUCESSO: modo_trabalho foi salvo no requisitos_json!');
            } else {
              console.log('❌ FALHA: modo_trabalho não foi salvo corretamente');
            }
          }
          resolve(result);
        } else {
          console.log('❌ Erro HTTP:', res.statusCode);
          console.log('Response:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Erro na requisição:', error.message);
      reject(error);
    });
    
    req.write(testData);
    req.end();
  });
}

async function runTest() {
  console.log('🧪 Iniciando teste de modo_trabalho...\n');
  
  try {
    // Testar conectividade
    await testHealth();
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Testar criação
    await testCreateJob();
    
    console.log('\n✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Teste falhou:', error.message);
  }
}

runTest();