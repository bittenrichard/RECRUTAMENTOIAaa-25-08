// Debug dos agendamentos do sistema
import fetch from 'node-fetch';

async function debugSchedules() {
  try {
    console.log('🔍 Investigando agendamentos do sistema para userId: 2');
    
    const response = await fetch('http://localhost:3001/api/schedules/2', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Status: ${response.status}`);
    
    const data = await response.json();
    console.log('📋 Dados dos schedules:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.results && data.results.length > 0) {
      console.log(`\n📊 Total de agendamentos no sistema: ${data.results.length}`);
      
      console.log('\n🎯 Detalhes dos agendamentos:');
      data.results.forEach((schedule, index) => {
        console.log(`  ${index + 1}. Título: "${schedule.Título || 'SEM TÍTULO'}"`);
        console.log(`     Início: ${schedule.Início}`);
        console.log(`     Fim: ${schedule.Fim}`);
        console.log(`     ID: ${schedule.id}`);
        console.log('     ---');
      });
    } else {
      console.log('✅ Nenhum agendamento encontrado no sistema');
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
  }
}

debugSchedules();