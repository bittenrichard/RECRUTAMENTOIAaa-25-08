import fetch from 'node-fetch';

async function testPost() {
  try {
    console.log('🧪 Testando POST endpoint...');
    
    const payload = {
      nome: "G",
      categoria: "G", 
      descricao: "G",
      nivel_dificuldade: "Médio",
      tempo_limite: "30", // String como vem do frontend
      ativo: "Ativo", // String como vem do frontend
      questoes: [{
        enunciado: "G",
        tipo: "multipla_escolha", 
        pontuacao: 1,
        opcoes: [
          { texto: "A", correta: false },
          { texto: "B", correta: true }
        ]
      }]
    };
    
    console.log('📤 Payload enviado:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('http://localhost:3001/api/theoretical-models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📊 Status:', response.status);
    
    const responseText = await response.text();
    console.log('📥 Response:', responseText);
    
    if (response.ok) {
      console.log('✅ Sucesso!');
    } else {
      console.log('❌ Erro:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testPost();