// Teste rápido da função limparTexto
const limparTexto = (texto) => {
  return texto
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, '') // Remove caracteres especiais problemáticos
    .replace(/�/g, '') // Remove especificamente o caractere �
    .replace(/\u00A0/g, ' ') // Substitui espaços não-quebráveis por espaços normais
    // Garantir espaçamento adequado após pontuações
    .replace(/([.!?;:])([A-ZÁÊÇÕ])/g, '$1 $2') // Adiciona espaço após pontuações seguidas de letras maiúsculas
    .replace(/([.!?])([a-záêçõ])/g, '$1 $2') // Adiciona espaço após pontuações seguidas de letras minúsculas
    .replace(/\s+/g, ' ') // Remove espaços duplos
    .trim(); // Remove espaços nas bordas
};

// Teste com os exemplos problemáticos
const teste1 = "Tanise, que alegria ter você no nosso time!Você foi oficialmente *CONTRATADO* para a vaga de *cdd* na *STL - FFT*!Seja muito bem-vindo(a)!Estamos ansiosos para trabalhar juntos.";

const teste2 = "Olá Tanise, tudo bem? Aqui é da *STL - FFT*!Você se candidatou para a vaga de *cdd* e gostaríamos de dar continuidade ao seu processo seletivo.Podemos conversar sobre a oportunidade?";

console.log("🧪 TESTE DA FUNÇÃO LIMPARO TEXTO\n");

console.log("📝 Teste 1 (ANTES):");
console.log(teste1);
console.log("\n📝 Teste 1 (DEPOIS):");
console.log(limparTexto(teste1));

console.log("\n" + "=".repeat(60) + "\n");

console.log("📝 Teste 2 (ANTES):");
console.log(teste2);
console.log("\n📝 Teste 2 (DEPOIS):");
console.log(limparTexto(teste2));