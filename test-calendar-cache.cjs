// 🚀 Teste de Performance do Cache do Google Calendar
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const USER_ID = '1'; // ID de usuário de teste

async function testCalendarCache() {
  console.log('🧪 TESTE DE CACHE DO GOOGLE CALENDAR');
  console.log('=====================================\n');
  
  try {
    // 1. Primeira requisição (deve buscar da API do Google)
    console.log('🔄 1ª Requisição (deve ir para API do Google)...');
    const start1 = Date.now();
    const response1 = await axios.get(`${BASE_URL}/api/google/calendar/events/${USER_ID}`);
    const time1 = Date.now() - start1;
    
    console.log(`✅ 1ª Resposta: ${response1.data.events?.length || 0} eventos`);
    console.log(`⏱️  Tempo: ${time1}ms`);
    console.log(`📊 Cache: ${response1.data.cached ? 'HIT' : 'MISS'}\n`);
    
    // 2. Segunda requisição imediata (deve usar cache)
    console.log('🚀 2ª Requisição (deve usar CACHE)...');
    const start2 = Date.now();
    const response2 = await axios.get(`${BASE_URL}/api/google/calendar/events/${USER_ID}`);
    const time2 = Date.now() - start2;
    
    console.log(`✅ 2ª Resposta: ${response2.data.events?.length || 0} eventos`);
    console.log(`⏱️  Tempo: ${time2}ms`);
    console.log(`📊 Cache: ${response2.data.cached ? 'HIT' : 'MISS'}\n`);
    
    // 3. Terceira requisição imediata (deve usar cache)
    console.log('🚀 3ª Requisição (deve usar CACHE)...');
    const start3 = Date.now();
    const response3 = await axios.get(`${BASE_URL}/api/google/calendar/events/${USER_ID}`);
    const time3 = Date.now() - start3;
    
    console.log(`✅ 3ª Resposta: ${response3.data.events?.length || 0} eventos`);
    console.log(`⏱️  Tempo: ${time3}ms`);
    console.log(`📊 Cache: ${response3.data.cached ? 'HIT' : 'MISS'}\n`);
    
    // 4. Análise de performance
    console.log('📈 ANÁLISE DE PERFORMANCE:');
    console.log(`   1ª req (API): ${time1}ms`);
    console.log(`   2ª req (Cache): ${time2}ms`);
    console.log(`   3ª req (Cache): ${time3}ms`);
    
    if (response2.data.cached && response3.data.cached) {
      const improvement2 = Math.round(((time1 - time2) / time1) * 100);
      const improvement3 = Math.round(((time1 - time3) / time1) * 100);
      console.log(`   🚀 Melhoria 2ª: ${improvement2}%`);
      console.log(`   🚀 Melhoria 3ª: ${improvement3}%`);
      console.log(`   ✅ CACHE FUNCIONANDO PERFEITAMENTE!`);
    } else {
      console.log(`   ❌ Cache não está funcionando como esperado`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

// Executar teste
testCalendarCache();