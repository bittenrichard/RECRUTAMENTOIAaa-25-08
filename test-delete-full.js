import axios from 'axios';

// Primeiro criar um novo modelo para teste
const createTestModel = async () => {
  try {
    console.log('📤 Criando modelo de teste...');
    
    const testData = {
      nome: 'Modelo Para Teste DELETE',
      descricao: 'Este modelo será usado para testar a funcionalidade DELETE',
      tempo_limite: 15,
      questoes: [{
        id: '1',
        tipo: 'verdadeiro_falso',
        enunciado: 'Este é um teste?',
        resposta_correta: 'Verdadeiro',
        pontuacao: 1
      }],
      ativo: true
    };
    
    const response = await axios.post('http://localhost:3001/api/theoretical-models', testData, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '2' // Criar com usuário 2
      }
    });
    
    console.log('✅ Modelo criado:', response.data.data.id);
    return response.data.data.id;
    
  } catch (error) {
    console.log('❌ Erro ao criar:', error.response?.data || error.message);
    return null;
  }
};

// Depois testar DELETE
const testDelete = async (modelId) => {
  try {
    console.log(`🗑️ Testando DELETE do modelo ${modelId} com usuário 2 (SUPER ADMIN)...`);
    
    const response = await axios.delete(`http://localhost:3001/api/theoretical-models/${modelId}`, {
      headers: {
        'x-user-id': '2'
      }
    });
    
    console.log('✅ DELETE Sucesso:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ DELETE Erro:', error.response?.data || error.message);
  }
};

// Executar teste completo
const runFullTest = async () => {
  const modelId = await createTestModel();
  if (modelId) {
    await testDelete(modelId);
  }
};

runFullTest();