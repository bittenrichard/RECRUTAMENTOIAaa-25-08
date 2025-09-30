const API_BASE_URL = 'http://localhost:3001';

async function testRequisitoJsonContent() {
  console.log('🔍 Verificando conteúdo do requisitos_json...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/data/all/1`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    if (data.jobs && data.jobs.length > 0) {
      console.log('📋 Últimas 3 vagas criadas:');
      const lastJobs = data.jobs.slice(-3);
      
      lastJobs.forEach((job, index) => {
        console.log(`\n--- Vaga ${index + 1} ---`);
        console.log('ID:', job.id);
        console.log('Título:', job.titulo);
        console.log('Modo Trabalho na propriedade:', job.modo_trabalho);
        console.log('Requisitos JSON:', job.requisitos_json);
        
        if (job.requisitos_json) {
          try {
            const parsed = JSON.parse(job.requisitos_json);
            console.log('Conteúdo parseado:', parsed);
            console.log('modo_trabalho no JSON:', parsed.modo_trabalho);
          } catch (error) {
            console.log('❌ Erro ao parsear JSON:', error.message);
          }
        } else {
          console.log('⚠️ Requisitos JSON vazio');
        }
      });
    } else {
      console.log('❌ Nenhuma vaga encontrada');
    }
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error);
  }
}

testRequisitoJsonContent();