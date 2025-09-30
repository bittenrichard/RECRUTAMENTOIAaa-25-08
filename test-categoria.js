import axios from 'axios';

const testData = {
  nome: 'Teste Categoria Debug',
  categoria: 'Categoria Teste Debug',
  descricao: 'Teste para verificar se categoria está sendo salva',
  tempo_limite: 30,
  questoes: [{
    id: '1',
    tipo: 'multipla_escolha',
    enunciado: 'Pergunta teste',
    opcoes: ['A', 'B', 'C', 'D'],
    resposta_correta: 'A',
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
  console.log('✅ Sucesso:', JSON.stringify(response.data, null, 2));
}).catch(error => {
  console.log('❌ Erro:', error.response?.data || error.message);
});