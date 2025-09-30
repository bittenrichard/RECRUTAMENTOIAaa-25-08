const API_BASE_URL = 'http://localhost:3001';

async function testServerWorking() {
  console.log('🧪 Testando se o servidor voltou ao normal...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/data/all/1`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Servidor funcionando!');
    console.log(`📊 Vagas encontradas: ${data.jobs?.length || 0}`);
    console.log(`👥 Candidatos encontrados: ${data.candidates?.length || 0}`);
    
    if (data.jobs && data.jobs.length > 0) {
      console.log('\n📋 Última vaga:');
      const lastJob = data.jobs[data.jobs.length - 1];
      console.log('- ID:', lastJob.id);
      console.log('- Título:', lastJob.titulo);
      console.log('- Descrição:', lastJob.descricao);
      console.log('- Modo trabalho:', lastJob.modo_trabalho);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro:', error);
    return false;
  }
}

testServerWorking();