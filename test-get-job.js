const API_BASE_URL = 'http://localhost:3001';

async function testGetJob() {
  console.log('🔍 Buscando uma vaga existente para verificar a estrutura...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const jobs = await response.json();
    if (jobs && jobs.length > 0) {
      console.log('📋 Primeira vaga encontrada:');
      console.log('ID:', jobs[0].id);
      console.log('Título:', jobs[0].titulo);
      console.log('Todas as propriedades:', Object.keys(jobs[0]));
      console.log('Objeto completo:', JSON.stringify(jobs[0], null, 2));
    } else {
      console.log('❌ Nenhuma vaga encontrada');
    }
  } catch (error) {
    console.error('❌ Erro ao buscar vagas:', error);
  }
}

testGetJob();