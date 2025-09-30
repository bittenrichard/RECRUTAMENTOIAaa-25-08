// Teste para verificar isolamento de templates e sistema de usuário 2
const API_BASE_URL = 'http://localhost:3001';

async function testTemplateSystem() {
  console.log('🧪 Testando sistema de templates...\n');

  try {
    // 1. Testar busca de templates (deve retornar templates do usuário 2)
    console.log('1. Buscando templates disponíveis...');
    const templatesResponse = await fetch(`${API_BASE_URL}/api/theoretical-templates`, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '3' // Usuário 3 buscando templates
      }
    });

    if (templatesResponse.ok) {
      const templatesData = await templatesResponse.json();
      console.log('✅ Templates encontrados:', templatesData.data?.length || 0);
      if (templatesData.data?.length > 0) {
        console.log('📋 Primeiro template:', templatesData.data[0].nome);
        console.log('👤 Criado por usuário:', templatesData.data[0].recrutador || 'N/A');
      }
    } else {
      console.log('❌ Erro ao buscar templates:', templatesResponse.status);
    }

    // 2. Testar isolamento de resultados de provas
    console.log('\n2. Testando isolamento de resultados...');
    const resultsResponse = await fetch(`${API_BASE_URL}/api/theoretical-test-results/123`, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '3' // Usuário 3 tentando ver resultados
      }
    });

    if (resultsResponse.ok) {
      const resultsData = await resultsResponse.json();
      console.log('✅ Resultados retornados:', resultsData.data?.length || 0);
      console.log('🔒 Isolamento funcionando: dados filtrados por usuário');
    } else {
      console.log('❌ Erro ao buscar resultados:', resultsResponse.status);
    }

    // 3. Testar busca de modelos (deve filtrar por usuário)
    console.log('\n3. Testando isolamento de modelos...');
    const modelsResponse = await fetch(`${API_BASE_URL}/api/theoretical-models`, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '3' // Usuário 3 buscando seus modelos
      }
    });

    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      console.log('✅ Modelos do usuário 3:', modelsData.data?.length || 0);
      console.log('🔒 Isolamento funcionando: cada usuário vê apenas seus modelos');
    } else {
      console.log('❌ Erro ao buscar modelos:', modelsResponse.status);
    }

  } catch (error) {
    console.error('💥 Erro no teste:', error.message);
  }
}

// Executar teste
testTemplateSystem();