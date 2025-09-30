// Local: src/shared/utils/whatsappMessages.ts

import { Candidate } from '../types';

export interface MessageTemplate {
  subject: string;
  content: string;
}

/**
 * Função para limpar caracteres especiais que causam problemas de codificação
 */
const limparTexto = (texto: string): string => {
  return texto
    .replace(/[^\u0020-\u007E\u00A0-\u00FF\n\r]/g, '') // Remove caracteres especiais problemáticos, mas preserva quebras de linha
    .replace(/�/g, '') // Remove especificamente o caractere �
    .replace(/\u00A0/g, ' ') // Substitui espaços não-quebráveis por espaços normais
    // Garantir espaçamento adequado após pontuações
    .replace(/([.!?;:])([A-ZÁÊÇÕ])/g, '$1 $2') // Adiciona espaço após pontuações seguidas de letras maiúsculas
    .replace(/([.!?])([a-záêçõ])/g, '$1 $2') // Adiciona espaço após pontuações seguidas de letras minúsculas
    .replace(/[ \t]+/g, ' ') // Remove apenas espaços e tabs duplos, preservando quebras de linha
    .replace(/\n\s+\n/g, '\n\n') // Limpa espaços entre quebras de linha duplas
    .trim(); // Remove espaços nas bordas
};

/**
 * Gera mensagens personalizadas do WhatsApp baseadas no status do candidato
 */
export const generatePersonalizedWhatsAppMessage = (
  candidate: Candidate, 
  nomeEmpresa: string
): string => {
  const status = candidate.status?.value || 'Triagem';
  const nomeCompleto = candidate.nome;
  const primeiroNome = nomeCompleto.split(' ')[0];
  const tituloVaga = candidate.vaga?.[0]?.titulo || candidate.vaga?.[0]?.value || 'posicao disponivel';
  
  // Debug: Log do status para verificar nomenclatura
  console.log(`🔍 WhatsApp Debug: Status do candidato = "${status}"`);
  
  const messageTemplates: Record<string, string> = {
    'Triagem': `Olá ${primeiroNome}, tudo bem? Aqui é da *${nomeEmpresa}*!

Você se candidatou para a vaga de *${tituloVaga}* e gostaríamos de dar continuidade ao seu processo seletivo.

Podemos conversar sobre a oportunidade? 💼`,

    'Entrevista': `Olá ${primeiroNome}, tudo bem? Aqui é da *${nomeEmpresa}*!

🎉 *Parabéns!* Você passou para a próxima etapa do processo seletivo para a vaga de *${tituloVaga}*.

Gostaríamos de agendar uma entrevista com você.

Quando seria um bom horário? 📅`,

    // CORREÇÃO: Adicionar variações do nome do status
    'Entrevista por Video': `Olá ${primeiroNome}, tudo bem? 😊 Aqui é da *${nomeEmpresa}*!

Você foi selecionado para a etapa de *entrevista por vídeo* da vaga *${tituloVaga}*.

🎬 Siga as instruções abaixo e responda as seguintes perguntas em um único vídeo:

*1️⃣ Quem é você e qual é a sua principal experiência profissional?*

*2️⃣ Por que você gostaria de trabalhar conosco?*

*3️⃣ Como você lida com situações de pressão ou imprevistos no trabalho?*

*4️⃣ Qual é a sua maior qualidade que pode contribuir para a nossa equipe?*

Aguardamos seu retorno! 🚀`,

    'Entrevista por Vídeo': `Olá ${primeiroNome}, tudo bem? 😊 Aqui é da *${nomeEmpresa}*!

Você foi selecionado para a etapa de *entrevista por vídeo* da vaga *${tituloVaga}*.

🎬 Siga as instruções abaixo e responda as seguintes perguntas em um único vídeo:

*1️⃣ Quem é você e qual é a sua principal experiência profissional?*

*2️⃣ Por que você gostaria de trabalhar conosco?*

*3️⃣ Como você lida com situações de pressão ou imprevistos no trabalho?*

*4️⃣ Qual é a sua maior qualidade que pode contribuir para a nossa equipe?*

Aguardamos seu retorno! 🚀`,

    'Teste Teorico': `Olá ${primeiroNome}, tudo bem? Aqui é da *${nomeEmpresa}*!

📚 Você passou para a etapa de *Teste Teórico* da vaga de *${tituloVaga}*.

Em breve enviaremos o link para realização do teste.

Aguarde nosso contato! 📋`,

    'Teste Teórico': `Olá ${primeiroNome}, tudo bem? Aqui é da *${nomeEmpresa}*!

📚 Você passou para a etapa de *Teste Teórico* da vaga de *${tituloVaga}*.

Em breve enviaremos o link para realização do teste.

Aguarde nosso contato! 📋`,

    'Entrevista Presencial': `Olá ${primeiroNome}, tudo bem? Aqui é da *${nomeEmpresa}*!

🎉 *Parabéns!* Você foi selecionado para a *Entrevista Presencial* da vaga de *${tituloVaga}*.

Vamos agendar um horário para conversarmos pessoalmente.

Qual seria sua disponibilidade? 🏢`,

    'Teste Pratico': `Olá ${primeiroNome}, tudo bem? Aqui é da *${nomeEmpresa}*!

🎯 Você passou para a etapa de *Teste Prático* da vaga de *${tituloVaga}*!

Esta é uma oportunidade para demonstrar suas habilidades na prática.

Em breve entraremos em contato com os detalhes. 💪`,

    'Teste Prático': `Olá ${primeiroNome}, tudo bem? Aqui é da *${nomeEmpresa}*!

🎯 Você passou para a etapa de *Teste Prático* da vaga de *${tituloVaga}*!

Esta é uma oportunidade para demonstrar suas habilidades na prática.

Em breve entraremos em contato com os detalhes. 💪`,

    'Aprovado': `🎉 *Parabéns* ${primeiroNome}!

É com grande satisfação que informamos que você foi *APROVADO* no processo seletivo para a vaga de *${tituloVaga}* na *${nomeEmpresa}*!

Em breve entraremos em contato para os próximos passos.

Seja bem-vindo(a) ao time! 🚀✨`,

    'Contratado': `🎊 ${primeiroNome}, que alegria ter você no nosso time!

Você foi oficialmente *CONTRATADO* para a vaga de *${tituloVaga}* na *${nomeEmpresa}*!

Seja muito bem-vindo(a)!

Estamos ansiosos para trabalhar juntos. 🤝🎉`,

    'Reprovado': `Olá ${primeiroNome}, tudo bem? 😊

Aqui é da *${nomeEmpresa}*.

Agradecemos seu interesse na vaga de *${tituloVaga}* e o tempo dedicado ao nosso processo seletivo.

Neste momento, decidimos seguir com outros candidatos, mas ficamos muito impressionados com seu perfil.

Manteremos seu currículo em nosso banco de talentos para futuras oportunidades!

Desejamos muito sucesso em sua jornada profissional. 🙏✨`,

    'Pendente': `Olá ${primeiroNome}, tudo bem? Aqui é da *${nomeEmpresa}*!

Estamos analisando sua candidatura para a vaga de *${tituloVaga}* e em breve retornaremos com mais informações.

Obrigado pela paciência!

Aguarde nosso contato. ⏳📋`
  };

  const mensagem = messageTemplates[status] || messageTemplates['Triagem'];
  return limparTexto(mensagem);
};

/**
 * Gera URL do WhatsApp com mensagem personalizada
 */
export const generateWhatsAppUrl = (
  phoneNumber: string, 
  candidate: Candidate, 
  nomeEmpresa: string
): string => {
  const message = generatePersonalizedWhatsAppMessage(candidate, nomeEmpresa);
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
};