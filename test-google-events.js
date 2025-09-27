// Teste dos eventos do Google Calendar
import fetch from 'node-fetch';

async function testGoogleCalendarEvents() {
  try {
    console.log('🧪 Testando eventos do Google Calendar para userId: 2');
    
    const response = await fetch('http://localhost:3001/api/google/calendar/events/2', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Status: ${response.status}`);
    
    const data = await response.json();
    console.log('📋 Dados recebidos:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log(`\n📊 Total de eventos: ${data.length || 0}`);
    
    if (data.length > 0) {
      console.log('\n🎯 Primeiros 3 eventos:');
      data.slice(0, 3).forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title} (${event.start})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testGoogleCalendarEvents();