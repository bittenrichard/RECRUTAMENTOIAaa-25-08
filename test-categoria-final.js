import axios from 'axios';

const testData = {
  nome: 'Teste Final Categoria',
  categoria: 'Tecnologia',
  descricao: 'Teste final para categoria',
  tempo_limite: 45,
  questoes: [{
    id: '1',
    tipo: 'verdadeiro_falso',
    enunciado: 'A categoria funciona?',
    resposta_correta: 'Verdadeiro',
    pontuacao: 1
  }],
  ativo: true
};

console.log('📤 Enviando dados:', JSON.stringify(testData, null, 2));

axios.post('http://localhost:3001/api/theoretical-models', testData, {
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': '2'
  }
}).then(response => {
  console.log('✅ Resposta completa:', JSON.stringify(response.data, null, 2));
  
  // Verificar se categoria está na resposta
  if (response.data.data.categoria) {
    console.log('🎉 CATEGORIA FUNCIONANDO:', response.data.data.categoria);
  } else {
    console.log('❌ Categoria não encontrada na resposta');
  }
}).catch(error => {
  console.log('❌ Erro:', error.response?.data || error.message);
});