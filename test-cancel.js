import fetch from 'node-fetch';

async function testCancelEndpoint() {
    const baseUrl = 'https://backend.recrutamentoia.com.br';
    const candidatoId = '262'; // ID de teste
    
    console.log('🔍 Testando endpoint de cancelamento...\n');
    
    try {
        console.log(`1️⃣ Tentando cancelar prova do candidato ${candidatoId}`);
        
        const cancelResponse = await fetch(`${baseUrl}/api/theoretical-test/${candidatoId}/cancel`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const cancelData = await cancelResponse.json();
        console.log('Status:', cancelResponse.status);
        console.log('Resposta:', JSON.stringify(cancelData, null, 2));
        
        if (cancelResponse.ok && cancelData.success) {
            console.log('\n✅ Cancelamento funcionou! Agora testando geração nova...');
            
            // Tentar gerar nova prova
            const generateResponse = await fetch(`${baseUrl}/api/theoretical-test/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidato_id: candidatoId,
                    modelo_prova_id: '20' // Modelo ativo
                })
            });
            
            const generateData = await generateResponse.json();
            console.log('\n2️⃣ Teste de geração após cancelamento:');
            console.log('Status geração:', generateResponse.status);
            console.log('Resposta geração:', JSON.stringify(generateData, null, 2));
            
            if (generateResponse.ok && generateData.success) {
                console.log('\n🎉 PERFEITO! Cancelamento e nova geração funcionaram!');
                console.log(`🔗 Nova prova ID: ${generateData.data.id}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro durante teste:', error.message);
    }
}

testCancelEndpoint();