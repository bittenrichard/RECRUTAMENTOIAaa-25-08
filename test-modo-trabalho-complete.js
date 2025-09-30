const API_BASE_URL = 'http://localhost:3001';

async function testModoTrabalhoCompleto() {
  console.log('🧪 TESTE COMPLETO: modo_trabalho no requisitos_json...');
  
  const testData = {
    titulo: 'TESTE FINAL MODO TRABALHO - ' + Date.now(),
    descricao: 'Testando salvamento do modo_trabalho no requisitos_json',
    endereco: 'São Paulo, SP',
    modo_trabalho: 'híbrido',
    requisitos_json: JSON.stringify({
      idade: { min: '25', max: '50' },
      experiencia: 'Mínimo 2 anos'
    }),
    usuario: [1]
  };

  console.log('📤 CRIANDO vaga com dados:', JSON.stringify(testData, null, 2));

  try {
    // 1. Criar vaga
    const createResponse = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!createResponse.ok) {
      console.log('❌ Erro na criação. Status:', createResponse.status);
      const errorText = await createResponse.text();
      console.log('❌ Erro:', errorText);
      return;
    }

    const createdJob = await createResponse.json();
    console.log('✅ Vaga criada:', createdJob.id);
    console.log('📄 Requisitos JSON retornado:', createdJob.requisitos_json);
    
    // Verificar se modo_trabalho foi salvo
    if (createdJob.requisitos_json) {
      try {
        const parsed = JSON.parse(createdJob.requisitos_json);
        console.log('🔍 Conteúdo parseado:', JSON.stringify(parsed, null, 2));
        if (parsed.modo_trabalho === 'híbrido') {
          console.log('🎉 SUCESSO! modo_trabalho foi salvo no requisitos_json!');
        } else {
          console.log('❌ ERRO: modo_trabalho não foi salvo corretamente');
        }
      } catch (error) {
        console.log('❌ Erro ao parsear JSON:', error.message);
      }
    }
    
    // 2. Aguardar e buscar dados via GET
    console.log('\n⏳ Aguardando 2 segundos para verificar dados...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dataResponse = await fetch(`${API_BASE_URL}/api/data/all/1`);
    if (dataResponse.ok) {
      const data = await dataResponse.json();
      const createdJobInData = data.jobs.find(job => job.id === createdJob.id);
      if (createdJobInData) {
        console.log('📋 Verificação no /api/data/all:');
        console.log('- Modo trabalho extraído:', createdJobInData.modo_trabalho);
        
        if (createdJobInData.modo_trabalho === 'híbrido') {
          console.log('🎉 PERFEITO! modo_trabalho foi extraído corretamente do requisitos_json!');
        } else {
          console.log('❌ ERRO: modo_trabalho não foi extraído corretamente');
        }
      }
    }
    
    // 3. Testar PATCH (edição)
    console.log('\n🔄 TESTANDO EDIÇÃO da vaga...');
    const updateData = {
      titulo: 'TESTE EDITADO - ' + Date.now(),
      modo_trabalho: 'remoto', // Mudando de híbrido para remoto
      requisitos_json: JSON.stringify({
        idade: { min: '30', max: '60' },
        experiencia: 'Mínimo 3 anos',
        formacao: 'Superior completo'
      })
    };
    
    console.log('📤 EDITANDO vaga com dados:', JSON.stringify(updateData, null, 2));
    
    const updateResponse = await fetch(`${API_BASE_URL}/api/jobs/${createdJob.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    if (!updateResponse.ok) {
      console.log('❌ Erro na edição. Status:', updateResponse.status);
      const errorText = await updateResponse.text();
      console.log('❌ Erro:', errorText);
      return;
    }
    
    const updatedJob = await updateResponse.json();
    console.log('✅ Vaga editada:', updatedJob.id);
    console.log('📄 Requisitos JSON atualizado:', updatedJob.requisitos_json);
    
    // Verificar se modo_trabalho foi atualizado
    if (updatedJob.requisitos_json) {
      try {
        const parsed = JSON.parse(updatedJob.requisitos_json);
        console.log('🔍 Conteúdo parseado atualizado:', JSON.stringify(parsed, null, 2));
        if (parsed.modo_trabalho === 'remoto') {
          console.log('🎉 SUCESSO! modo_trabalho foi atualizado no requisitos_json!');
        } else {
          console.log('❌ ERRO: modo_trabalho não foi atualizado corretamente');
        }
      } catch (error) {
        console.log('❌ Erro ao parsear JSON atualizado:', error.message);
      }
    }
    
    console.log('\n🏁 TESTE COMPLETO FINALIZADO!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testModoTrabalhoCompleto();