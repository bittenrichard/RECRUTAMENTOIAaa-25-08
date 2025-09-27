import fetch from 'node-fetch';

async function testGoogleEvents() {
  try {
    console.log('🔍 Testando listagem de eventos...');
    
    const response = await fetch('http://localhost:3001/api/google/calendar/events/2');
    const data = await response.json();
    
    console.log('📅 Status:', response.status);
    console.log('📅 Resposta:', JSON.stringify(data, null, 2));
    
    if (data.events) {
      console.log(`📊 Total de eventos: ${data.events.length}`);
      data.events.forEach((event, index) => {
        console.log(`📌 Evento ${index + 1}:`, {
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testGoogleEvents();