import axios from 'axios';

// Teste de DELETE com usuário 2 (SUPER ADMIN)
const testDelete = async () => {
  try {
    console.log('🗑️ Testando DELETE com usuário 2 (SUPER ADMIN)...');
    console.log('🗑️ Tentando deletar modelo ID 41...');
    
    const response = await axios.delete('http://localhost:3001/api/theoretical-models/41', {
      headers: {
        'x-user-id': '2'
      }
    });
    
    console.log('✅ Sucesso:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Erro:', error.response?.data || error.message);
  }
};

testDelete();