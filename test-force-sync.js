// Teste de sincronização FORÇADA TOTAL
import fetch from 'node-fetch';

async function testForceSync() {
  try {
    console.log('🔄 Iniciando SINCRONIZAÇÃO FORÇADA TOTAL para userId: 2...\n');
    
    const response = await fetch('http://localhost:3001/api/google/calendar/force-sync/2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Status: ${response.status}`);
    
    const data = await response.json();
    console.log('\n🎯 RESULTADO DA SINCRONIZAÇÃO:');
    console.log('═'.repeat(50));
    console.log(`✅ Sucesso: ${data.success}`);
    console.log(`📊 Total de eventos: ${data.totalEvents || 0}`);
    console.log(`📅 Período: ${data.timeRange?.from} até ${data.timeRange?.to}`);
    
    if (data.sampleEvents && data.sampleEvents.length > 0) {
      console.log('\n🔍 EXEMPLOS DE EVENTOS SINCRONIZADOS:');
      data.sampleEvents.forEach((event, index) => {
        console.log(`\n[${index + 1}] ${event.title}`);
        console.log(`    📅 Início: ${event.start}`);
        console.log(`    ⏰ Fim: ${event.end}`);
        console.log(`    🆔 ID: ${event.id}`);
      });
    }
    
    if (data.error) {
      console.log(`\n❌ ERRO: ${data.error}`);
      console.log(`💬 Mensagem: ${data.message}`);
    }
    
    console.log('\n' + '═'.repeat(50));
    console.log('🎊 SINCRONIZAÇÃO CONCLUÍDA!');
    console.log('\n💡 Agora acesse o sistema e verifique se os eventos aparecem com títulos reais!');
    
  } catch (error) {
    console.error('\n❌ ERRO no teste de sincronização:', error.message);
    console.log('\n🔧 Certifique-se de que:');
    console.log('   1. O servidor está rodando na porta 3001');
    console.log('   2. O Google Calendar está conectado para o usuário 2');
    console.log('   3. Há eventos na agenda do Google Calendar');
  }
}

testForceSync();