// Teste das mensagens por status
const { generatePersonalizedWhatsAppMessage } = require('./src/shared/utils/whatsappMessages.ts');

// Simular candidato de teste
const candidatoTeste = {
  nome: "Tanise Suélem Maia Castro",
  vaga: [{ titulo: "Limpeza", value: "Limpeza" }]
};

const nomeEmpresa = "STL - FFT";

console.log('🧪 TESTE DE MENSAGENS POR STATUS\n');

// Lista de status para testar
const statusList = [
  'Triagem',
  'Entrevista', 
  'Entrevista por Video',
  'Teste Teorico',
  'Entrevista Presencial',
  'Teste Pratico',
  'Aprovado',
  'Contratado',
  'Reprovado',
  'Pendente'
];

statusList.forEach(status => {
  const candidatoComStatus = {
    ...candidatoTeste,
    status: { value: status }
  };
  
  console.log(`📋 STATUS: ${status}`);
  console.log(`📄 Mensagem:`);
  console.log(generatePersonalizedWhatsAppMessage(candidatoComStatus, nomeEmpresa));
  console.log('\n' + '='.repeat(60) + '\n');
});