const API_BASE_URL = 'http://localhost:3001';

async function testGetAllData() {
  console.log('🔍 Testando endpoint /api/data/all/1...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/data/all/1`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    if (data.jobs && data.jobs.length > 0) {
      console.log('📋 Primeira vaga encontrada:');
      const job = data.jobs[0];
      console.log('ID:', job.id);
      console.log('Título:', job.titulo);
      console.log('Modo Trabalho:', job.modo_trabalho);
      console.log('Todas as propriedades:', Object.keys(job));
      console.log('\n📄 Objeto completo:');
      console.log(JSON.stringify(job, null, 2));
    } else {
      console.log('❌ Nenhuma vaga encontrada');
    }
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error);
  }
}

testGetAllData();