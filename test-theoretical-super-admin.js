const fetch = require('node-fetch');

async function testTheoreticalTestEndpoint() {
  console.log('🧪 Testando endpoint de provas teóricas para super admin...\n');

  try {
    // Teste 1: Super Admin (userId = 2) deve ver todas as provas
    console.log('📋 Teste 1: Super Admin (ID 2) - Deve ver TODAS as provas');
    const superAdminResponse = await fetch('http://localhost:3001/api/theoretical-test/results/312651', {
      method: 'GET',
      headers: {
        'x-user-id': '2',
        'Content-Type': 'application/json'
      }
    });

    const superAdminData = await superAdminResponse.json();
    console.log(`✅ Status: ${superAdminResponse.status}`);
    console.log(`📊 Provas encontradas: ${superAdminData.data?.length || 0}`);
    console.log(`📄 Dados:`, JSON.stringify(superAdminData, null, 2));

    console.log('\n' + '='.repeat(50) + '\n');

    // Teste 2: Usuário normal (userId = 3) para comparação
    console.log('📋 Teste 2: Usuário Normal (ID 3) - Deve ver apenas suas provas');
    const normalUserResponse = await fetch('http://localhost:3001/api/theoretical-test/results/312651', {
      method: 'GET',
      headers: {
        'x-user-id': '3',
        'Content-Type': 'application/json'
      }
    });

    const normalUserData = await normalUserResponse.json();
    console.log(`✅ Status: ${normalUserResponse.status}`);
    console.log(`📊 Provas encontradas: ${normalUserData.data?.length || 0}`);
    console.log(`📄 Dados:`, JSON.stringify(normalUserData, null, 2));

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testTheoreticalTestEndpoint();