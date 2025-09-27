// Script para testar se o evento criado existe no Google Calendar
import fetch from 'node-fetch';

const eventId = 'aj8hj4uvnelo420oopn04selqg'; // ID do evento que foi criado
const userId = 2; // ID do usuário

console.log('🔍 Verificando se o evento existe no Google Calendar...');
console.log('📅 Event ID:', eventId);
console.log('👤 User ID:', userId);
console.log('');

async function checkEvent() {
  try {
    console.log('🚀 Fazendo requisição para verificar evento...');
    
    const response = await fetch(`http://localhost:3001/api/google/calendar/event/${userId}/${eventId}`);
    const data = await response.json();
    
    console.log('📡 Status:', response.status);
    console.log('📄 Resposta:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Evento encontrado no Google Calendar!');
      console.log('📋 Título:', data.event.summary);
      console.log('📅 Início:', data.event.start?.dateTime);
      console.log('🔗 Link:', data.event.htmlLink);
    } else {
      console.log('❌ Evento não encontrado:', data.message);
    }
    
  } catch (error) {
    console.error('💥 Erro na verificação:', error.message);
  }
}

checkEvent();