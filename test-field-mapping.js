const API_BASE_URL = 'http://localhost:3001';

async function testFieldMapping() {
  console.log('🧪 TESTE: Mapeamento de campos no Baserow...');
  
  const testData = {
    titulo: 'TESTE CAMPO - ' + Date.now(),
    descricao: 'TESTE: Vamos colocar o modo_trabalho na descrição para verificar se funciona',
    endereco: 'São Paulo, SP',
    modo_trabalho: 'híbrido', // Este é o campo que queremos testar
    requisitos_json: JSON.stringify({
      modo_trabalho_backup: 'híbrido', // Backup no JSON
      teste: 'Campo de teste'
    }),
    usuario: [1]
  };

  console.log('📤 Enviando dados de teste:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Resposta do servidor:');
    console.log('- Título salvo:', result.titulo);
    console.log('- Descrição salva:', result.descricao);
    console.log('- Endereco salvo:', result.Endereco);
    console.log('- Requisitos JSON:', result.requisitos_json);
    
    // Verificar se há qualquer campo relacionado a modo de trabalho
    const allKeys = Object.keys(result);
    const workModeKeys = allKeys.filter(key => 
      key.toLowerCase().includes('modo') || 
      key.toLowerCase().includes('work') || 
      key.toLowerCase().includes('modalidade')
    );
    
    console.log('🔍 Campos relacionados a modo/trabalho:', workModeKeys);
    
    return result;
  } catch (error) {
    console.error('❌ Erro:', error);
    return null;
  }
}

testFieldMapping().catch(console.error);