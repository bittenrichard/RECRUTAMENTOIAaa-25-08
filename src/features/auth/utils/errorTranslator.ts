// Caminho: src/features/auth/utils/errorTranslator.ts
// SUBSTITUA O CONTEÚDO INTEIRO DESTE ARQUIVO

export const translateAuthError = (errorCode: string): string => {
    switch (errorCode) {
      case 'Este e-mail já está cadastrado.':
        return 'Este e-mail já está em uso. Por favor, tente outro.';
      case 'E-mail ou senha inválidos.':
        return 'E-mail ou senha incorretos. Verifique seus dados.';
      case 'A senha deve ter no mínimo 6 caracteres.':
          return 'Sua senha precisa ter pelo menos 6 caracteres.';
      case 'Network request failed':
          return 'Não foi possível conectar ao servidor. Verifique sua internet.';
      default:
        return 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
    }
};