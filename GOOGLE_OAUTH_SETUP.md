# 🔧 Configuração Google OAuth para Desenvolvimento Local

## ❌ Problema Atual
O erro `500 (Internal Server Error)` no callback do Google OAuth acontece porque:

1. **Credenciais configuradas para produção**: As credenciais OAuth apontam para `https://backend.recrutamentoia.com.br`
2. **Servidor local não autorizado**: O Google Cloud Console não tem `http://localhost:3001` como URI autorizada
3. **Callback falha**: Quando o usuário autoriza, o Google tenta redirecionar para produção, mas deveria ir para localhost

## ✅ Solução Definitiva (Recomendada)

### Passo 1: Acessar Google Cloud Console
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione o projeto: **`recrutamentoia`**
3. Vá em **"APIs & Services"** > **"Credentials"**

### Passo 2: Modificar Credencial Existente
1. Clique na credencial existente: `726048519835-4o31uj1ssftc47a08kcb8hs1hkm2v040.apps.googleusercontent.com`
2. Na seção **"Authorized redirect URIs"**, adicione:
   ```
   http://localhost:3001/api/google/auth/callback
   ```
3. Mantenha a URI de produção também:
   ```
   https://backend.recrutamentoia.com.br/api/google/auth/callback
   ```
4. **SALVE** as alterações

### Passo 3: Verificar Origins Autorizadas
Na mesma credencial, na seção **"Authorized JavaScript origins"**, certifique-se de ter:
```
http://localhost:5173
https://recrutamentoia.com.br
```

### Passo 4: Aguardar Propagação
As mudanças podem levar até 5 minutos para fazer efeito.

## 🛠️ Soluções Alternativas (Temporárias)

### Opção A: Usar ngrok (Recomendada para teste)
```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta local
ngrok http 3001

# Usar a URL fornecida (ex: https://abc123.ngrok.io) no Google Cloud Console
```

### Opção B: Criar Credenciais Separadas para Dev
1. No Google Cloud Console, criar **"OAuth 2.0 Client ID"** novo
2. Nome: `RecrutamentoIA - Desenvolvimento`
3. Authorized redirect URIs: `http://localhost:3001/api/google/auth/callback`
4. Atualizar `.env.local` com novas credenciais

### Opção C: Modificar Hosts (Não recomendada)
Adicionar no arquivo hosts do Windows (`C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1 backend.recrutamentoia.com.br
```

## 📝 Status Atual do Sistema

✅ **Backend configurado** para ambiente de desenvolvimento  
✅ **Frontend com warnings** informativos sobre modo dev  
✅ **Logs detalhados** para debugging  
❌ **Google OAuth** aguardando configuração no Cloud Console  

## 🚀 Após Configurar

1. Reinicie o servidor backend: `npm run server`
2. Teste a conexão do Google Calendar na página de Configurações
3. Verifique os logs no console do navegador
4. O popup deve funcionar e o callback deve ser bem-sucedido

---

**💡 Dica**: A Solução Definitiva (modificar credencial existente) é a mais simples e segura para usar tanto em desenvolvimento quanto em produção.