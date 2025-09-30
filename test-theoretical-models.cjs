// 🧪 Teste para modelos de prova teórica
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const USER_ID = '2'; // Usuário que estava tendo problema

async function testTheoreticalModels() {
  console.log('🧪 TESTE DE MODELOS DE PROVA TEÓRICA');
  console.log('=====================================\n');
  
  try {
    console.log(`🔄 Buscando modelos para usuário ${USER_ID}...`);
    
    const response = await axios.get(`${BASE_URL}/api/public/theoretical-models`, {
      headers: {
        'x-user-id': USER_ID
      }
    });
    
    console.log('✅ Resposta recebida:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📦 Success: ${response.data.success}`);
    console.log(`📋 Modelos encontrados: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      console.log('\n🎯 MODELOS ENCONTRADOS:');
      response.data.data.forEach((model, index) => {
        console.log(`   ${index + 1}. ID: ${model.id}`);
        console.log(`      Nome: ${model.nome || model.titulo}`);
        console.log(`      Ativo: ${model.ativo}`);
        console.log(`      Questões: ${model.total_questoes}`);
        console.log(`      Tempo: ${model.tempo_limite} min`);
        console.log('');
      });
      
      console.log('🎉 SUCESSO! Modelos ativos encontrados.');
      console.log('✅ O erro "Não há modelos de prova ativo" foi CORRIGIDO!');
    } else {
      console.log('❌ Nenhum modelo encontrado.');
      console.log('⚠️  O problema ainda persiste.');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

// Executar teste
testTheoreticalModels();