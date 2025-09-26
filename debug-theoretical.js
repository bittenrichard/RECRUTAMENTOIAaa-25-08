// Debug local para testar servidor
const baseUrl = 'http://localhost:3001';

async function testLocalEndpoints() {
    
    console.log('🔍 Testando endpoints da prova teórica...\n');
    
    try {
        // 1. Testar modelos
        console.log('1️⃣ Testando /api/theoretical-models');
        const modelsResponse = await fetch(`${baseUrl}/api/theoretical-models`);
        const modelsData = await modelsResponse.json();
        console.log('Status:', modelsResponse.status);
        console.log('Resposta:', JSON.stringify(modelsData, null, 2));
        
        if (modelsData.success && modelsData.data && modelsData.data.length > 0) {
            console.log('\n2️⃣ Testando geração de prova');
            
            // Pegar o primeiro modelo ATIVO disponível
            const activeModel = modelsData.data.find(model => model.ativo);
            if (!activeModel) {
                console.log('❌ Nenhum modelo ativo encontrado!');
                return;
            }
            console.log('Modelo ativo selecionado:', activeModel.nome, 'ID:', activeModel.id);
            
            // Testar geração de prova
            const generateResponse = await fetch(`${baseUrl}/api/theoretical-test/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidato_id: '262', // ID de candidato real do sistema
                    modelo_prova_id: activeModel.id.toString()
                })
            });
            
            const generateData = await generateResponse.json();
            console.log('Status geração:', generateResponse.status);
            console.log('Resposta geração:', JSON.stringify(generateData, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Erro durante teste:', error.message);
    }
}

testLocalEndpoints();