// 🧪 Teste do sistema de templates
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const USER_ID = '2'; // Usuário de teste

async function testTemplateSystem() {
  console.log('🧪 TESTE DO SISTEMA DE TEMPLATES');
  console.log('==================================\n');
  
  try {
    // 1. Buscar templates disponíveis
    console.log('📋 1. Buscando templates disponíveis...');
    const templatesResponse = await axios.get(`${BASE_URL}/api/theoretical-templates`, {
      headers: {
        'x-user-id': USER_ID
      }
    });
    
    console.log(`✅ Templates encontrados: ${templatesResponse.data.data.length}`);
    
    if (templatesResponse.data.data.length > 0) {
      const template = templatesResponse.data.data[0];
      console.log(`📄 Template exemplo: "${template.nome}" (ID: ${template.id})`);
      console.log(`   - Questões: ${template.total_questoes}`);
      console.log(`   - Tempo: ${template.tempo_limite} min\n`);
      
      // 2. Duplicar um template
      console.log('🔄 2. Duplicando template...');
      const duplicateResponse = await axios.post(`${BASE_URL}/api/theoretical-templates/${template.id}/duplicate`, {
        userId: USER_ID,
        customName: `${template.nome} - Teste Automatizado`,
        customDescription: 'Template duplicado automaticamente para teste'
      }, {
        headers: {
          'x-user-id': USER_ID
        }
      });
      
      console.log(`✅ Template duplicado com sucesso!`);
      console.log(`   - Novo ID: ${duplicateResponse.data.data.id}`);
      console.log(`   - Nome: ${duplicateResponse.data.data.nome}\n`);
      
      // 3. Verificar se aparece nos modelos do usuário
      console.log('📋 3. Verificando modelos do usuário...');
      const userModelsResponse = await axios.get(`${BASE_URL}/api/theoretical-models`, {
        headers: {
          'x-user-id': USER_ID
        }
      });
      
      console.log(`✅ Modelos do usuário: ${userModelsResponse.data.data.length}`);
      
      const duplicatedModel = userModelsResponse.data.data.find(m => m.id === duplicateResponse.data.data.id);
      if (duplicatedModel) {
        console.log(`🎉 Template duplicado aparece nos modelos do usuário!`);
        console.log(`   - Nome: ${duplicatedModel.nome}`);
        console.log(`   - Ativo: ${duplicatedModel.ativo}`);
      } else {
        console.log(`❌ Template duplicado NÃO aparece nos modelos do usuário`);
      }
      
    } else {
      console.log('⚠️  Nenhum template encontrado para testar duplicação');
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

// Executar teste
testTemplateSystem();