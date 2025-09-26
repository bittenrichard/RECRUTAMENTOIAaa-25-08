import fetch from 'node-fetch';

async function testDirectGeneration() {
    const baseUrl = 'https://backend.recrutamentoia.com.br';
    
    console.log('🔍 Testando geração direta de prova teórica...\n');
    
    // IDs conhecidos do sistema (baseado no que vimos anteriormente)
    const testCases = [
        { candidato_id: '262', modelo_prova_id: '20', nome: 'Candidato Teste 262' },
        { candidato_id: '1', modelo_prova_id: '20', nome: 'Candidato Teste 1' },
        { candidato_id: '100', modelo_prova_id: '20', nome: 'Candidato Teste 100' }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        
        console.log(`${i + 1}️⃣ Testando ${testCase.nome}`);
        console.log(`   Candidato ID: ${testCase.candidato_id}, Modelo ID: ${testCase.modelo_prova_id}`);
        
        try {
            const generateResponse = await fetch(`${baseUrl}/api/theoretical-test/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidato_id: testCase.candidato_id,
                    modelo_prova_id: testCase.modelo_prova_id
                })
            });
            
            const generateData = await generateResponse.json();
            console.log(`   Status: ${generateResponse.status}`);
            
            if (generateResponse.ok && generateData.success) {
                console.log('   ✅ SUCESSO! Prova gerada com ID:', generateData.data.id);
                console.log(`   🔗 Link: https://recrutamentoia.com.br/prova-teorica/${generateData.data.id}`);
                break; // Para no primeiro sucesso
            } else {
                console.log(`   ❌ Erro: ${generateData.error || 'Erro desconhecido'}`);
            }
            
        } catch (error) {
            console.log(`   💥 Exceção: ${error.message}`);
        }
        
        console.log(''); // Linha em branco
    }
    
    console.log('🏁 Teste concluído!');
}

testDirectGeneration();