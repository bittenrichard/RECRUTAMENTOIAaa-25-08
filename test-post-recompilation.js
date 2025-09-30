const API_BASE_URL = 'http://localhost:3001';

async function testPostRecompilation() {
  console.log('🧪 TESTE: Após recompilação do servidor...');
  
  const testData = {
    titulo: 'PÓS RECOMPILAÇÃO - ' + Date.now(),
    descricao: 'Testando após recompilação',
    endereco: 'Após Recompilação',
    modo_trabalho: 'presencial',
    requisitos_json: JSON.stringify({
      idade: { min: '21', max: '60' }
    }),
    usuario: [1]
  };

  console.log('📤 Testando POST com modo_trabalho:', testData.modo_trabalho);

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      console.log('❌ Status:', response.status);
      const errorText = await response.text();
      console.log('❌ Erro:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Vaga criada ID:', result.id);
    console.log('📄 Requisitos JSON retornado:', result.requisitos_json);
    
    // Verificar se modo_trabalho foi adicionado
    if (result.requisitos_json) {
      try {
        const parsed = JSON.parse(result.requisitos_json);
        console.log('🔍 Conteúdo parseado:', JSON.stringify(parsed, null, 2));
        if (parsed.modo_trabalho) {
          console.log('🎉 SUCESSO! modo_trabalho foi adicionado:', parsed.modo_trabalho);
        } else {
          console.log('❌ modo_trabalho não foi adicionado ao JSON');
        }
      } catch (error) {
        console.log('❌ Erro ao parsear JSON:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

testPostRecompilation();