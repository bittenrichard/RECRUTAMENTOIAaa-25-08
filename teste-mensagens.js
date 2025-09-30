// Local: exemplo de teste das mensagens corrigidas
// Este arquivo mostra as mensagens personalizadas sem caracteres especiais

// Simulação da função corrigida
const generatePersonalizedWhatsAppMessage = (candidate, nomeEmpresa) => {
  const status = candidate.status?.value || 'Triagem';
  const nomeCompleto = candidate.nome;
  const primeiroNome = nomeCompleto.split(' ')[0];
  const tituloVaga = candidate.vaga?.[0]?.titulo || candidate.vaga?.[0]?.value || 'posicao disponivel';
  
  const messageTemplates = {
    'Triagem': `Ola ${primeiroNome}, tudo bem? Aqui e da ${nomeEmpresa}! 👋

Voce se candidatou para a vaga de *${tituloVaga}* e gostariamos de dar continuidade ao seu processo seletivo.

Podemos conversar sobre a oportunidade?`,

    'Entrevista': `Ola ${primeiroNome}, tudo bem? Aqui e da ${nomeEmpresa}! 👋

Parabens! Voce passou para a proxima etapa do processo seletivo para a vaga de *${tituloVaga}*.

Gostariamos de agendar uma entrevista com voce. Quando seria um bom horario?`,

    'Entrevista por Video': `Ola ${primeiroNome}, tudo bem? Aqui e da ${nomeEmpresa}, voce foi selecionado para a etapa de entrevista da vaga *${tituloVaga}*.

Siga abaixo as instrucoes e responda as seguintes perguntas em um unico video:

1️⃣ Quem e voce e qual e a sua principal experiencia profissional?

2️⃣ Por que voce gostaria de trabalhar conosco?

3️⃣ Como voce lida com situacoes de pressao ou imprevistos no trabalho?

4️⃣ Qual e a sua maior qualidade que pode contribuir para a nossa equipe?

Aguardamos seu retorno! 🎬`,

    'Teste Teorico': `Ola ${primeiroNome}, tudo bem? Aqui e da ${nomeEmpresa}! 👋

Voce passou para a etapa de *Teste Teorico* da vaga de *${tituloVaga}*.

Em breve enviaremos o link para realizacao do teste. Aguarde nosso contato!`,

    'Aprovado': `🎉 Parabens ${primeiroNome}!

E com grande satisfacao que informamos que voce foi *APROVADO* no processo seletivo para a vaga de *${tituloVaga}* na ${nomeEmpresa}!

Em breve entraremos em contato para os proximos passos. Seja bem-vindo(a) ao time! 🚀`,
  };

  return messageTemplates[status] || messageTemplates['Triagem'];
};

// Exemplo de candidato para teste
const candidatoExemplo = {
  nome: "João Silva",
  telefone: "5511999887766",
  status: { value: "Entrevista por Video" },
  vaga: [{ value: "Desenvolvedor Frontend", titulo: "Desenvolvedor Frontend" }]
};

// Empresa do usuário (exemplo)
const empresaUsuario = "Tech Solutions LTDA";

// Teste das mensagens corrigidas
console.log("=== MENSAGENS CORRIGIDAS SEM CARACTERES ESPECIAIS ===");

const statusParaTestar = [
  'Triagem',
  'Entrevista',
  'Entrevista por Video',
  'Teste Teorico',
  'Aprovado'
];

statusParaTestar.forEach(status => {
  const candidatoTeste = { ...candidatoExemplo, status: { value: status } };
  const mensagem = generatePersonalizedWhatsAppMessage(candidatoTeste, empresaUsuario);
  
  console.log(`\n--- STATUS: ${status} ---`);
  console.log(mensagem);
  console.log(`\nURL: https://wa.me/5511999887766?text=${encodeURIComponent(mensagem)}`);
  console.log("=".repeat(80));
});