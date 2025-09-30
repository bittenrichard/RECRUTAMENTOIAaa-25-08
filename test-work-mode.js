const API_BASE_URL = 'http://localhost:3001';

async function testWorkModeCreation() {
  console.log('🧪 Testando criação de vaga com modo_trabalho...');
  
  const testData = {
    titulo: 'Teste Modalidade - ' + Date.now(),
    descricao: 'Testando se o modo de trabalho está sendo salvo corretamente',
    endereco: 'São Paulo, SP',
    modo_trabalho: 'remoto',
    requisitos_json: JSON.stringify({
      idade: { min: '18', max: '65' }
    }),
    usuario: [1]
  };

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
    console.log('✅ Vaga criada com sucesso:');
    console.log('ID:', result.id);
    console.log('Título:', result.titulo);
    console.log('Modo Trabalho:', result.modo_trabalho);
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao criar vaga:', error);
    return null;
  }
}

async function testWorkModeUpdate(jobId) {
  console.log('\n🧪 Testando atualização de vaga com modo_trabalho...');
  
  const updateData = {
    titulo: 'Teste Modalidade Atualizada - ' + Date.now(),
    modo_trabalho: 'hibrido', // Mudando de remoto para híbrido
    descricao: 'Testando atualização do modo de trabalho'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Vaga atualizada com sucesso:');
    console.log('ID:', result.id);
    console.log('Título:', result.titulo);
    console.log('Modo Trabalho:', result.modo_trabalho);
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao atualizar vaga:', error);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de modo_trabalho...\n');
  
  // Teste 1: Criar vaga
  const createdJob = await testWorkModeCreation();
  if (!createdJob) {
    console.log('❌ Teste de criação falhou. Interrompendo.');
    return;
  }

  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 2: Atualizar vaga
  const updatedJob = await testWorkModeUpdate(createdJob.id);
  if (!updatedJob) {
    console.log('❌ Teste de atualização falhou.');
    return;
  }

  console.log('\n🎉 Todos os testes concluídos!');
  console.log('📋 Resumo:');
  console.log('- Criação: modo_trabalho =', createdJob.modo_trabalho);
  console.log('- Atualização: modo_trabalho =', updatedJob.modo_trabalho);
  
  if (createdJob.modo_trabalho === 'remoto' && updatedJob.modo_trabalho === 'hibrido') {
    console.log('✅ SUCESSO: Modalidade de trabalho está sendo salva corretamente!');
  } else {
    console.log('❌ FALHA: Modalidade de trabalho não está sendo salva corretamente.');
  }
}

runTests().catch(console.error);