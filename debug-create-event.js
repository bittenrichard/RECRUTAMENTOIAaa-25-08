// Script para testar criação de evento simplificado no Google Calendar
// Para executar: node debug-create-event.js

console.log('🧪 Testando criação de evento SIMPLIFICADO no Google Calendar...\n');

// Simular dados de teste SIMPLIFICADOS
const testEventData = {
  userId: 2, // ID do usuário de teste
  eventData: {
    start: new Date('2025-09-28T14:00:00').toISOString(),
    end: new Date('2025-09-28T15:00:00').toISOString(),
    title: 'Teste Evento Simples',
    details: 'Evento de teste simplificado'
  },
  candidate: {
    id: 1,
    nome: 'João Silva',
    email: 'joao@teste.com',
    telefone: '11999999999',
    score: 85
  },
  job: {
    id: 1,
    titulo: 'Desenvolvedor React'
  }
};

console.log('📋 Dados do evento:');
console.log('- Data início:', testEventData.eventData.start);
console.log('- Data fim:', testEventData.eventData.end);
console.log('- Título:', testEventData.eventData.title);
console.log('- Candidato:', testEventData.candidate.nome);
console.log('- Vaga:', testEventData.job.titulo);
console.log();

import('node-fetch').then(({ default: fetch }) => {
  return fetch('http://localhost:3001/api/google/calendar/create-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testEventData)
  });
}).then(response => {
  console.log('📡 Status da resposta:', response.status);
  return response.json();
}).then(data => {
  console.log('📄 Resposta completa:', JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log('✅ Evento criado com sucesso!');
    console.log('🔗 ID do evento:', data.data?.id);
    console.log('🌐 Link do evento:', data.data?.htmlLink);
  } else {
    console.log('❌ Falha na criação:', data.message);
  }
}).catch(error => {
  console.error('💥 Erro na requisição:', error.message);
});