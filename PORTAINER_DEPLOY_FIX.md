# 🐳 INSTRUÇÕES PARA DEPLOY NO PORTAINER

## 📋 Problema Identificado

O backend está rodando mas não consegue acessar as variáveis de ambiente porque elas não estão sendo injetadas no container pelo Portainer.

## ✅ Solução

### Passo 1: Acessar o Portainer
1. Faça login no seu Portainer
2. Navegue até **Stacks** > **recrutamentoia** (ou o nome do seu stack)

### Passo 2: Configurar Variáveis de Ambiente
1. Clique em **Editor** ou **Edit stack**
2. Role até a seção **Environment variables**
3. Copie TODAS as variáveis do arquivo `PORTAINER_ENV_VARS.txt`
4. Cole na seção de variáveis de ambiente

### Passo 3: Atualizar o Stack
1. Clique em **Update the stack**
2. Aguarde o redeploy
3. Verifique os logs do backend

## 🔍 Como Verificar se Funcionou

Nos logs do backend você deve ver:
- ✅ `[OAuth Setup] Client ID: 726048519835-4o31uj1...`
- ✅ `🗄️  Baserow API: Configurado`
- ✅ `🤖 N8N Webhooks: Configurado`

E NÃO deve ver:
- ❌ `AVISO: Algumas variáveis de ambiente estão faltando`
- ❌ `ERRO CRÍTICO: Credenciais do Google são obrigatórias`
- ❌ `A chave da API do Baserow não foi encontrada`

## 📁 Arquivos Importantes

- `.env` - Configurações para produção (backup)
- `.env.production` - Configurações específicas para NODE_ENV=production  
- `PORTAINER_ENV_VARS.txt` - Variáveis prontas para copiar no Portainer
- `docker-compose.yml` - Configuração dos serviços

## 🔧 Troubleshooting

Se ainda houver problemas:

1. **Verifique os logs**: `docker logs <container_id>`
2. **Confirme o NODE_ENV**: Deve estar como `production`
3. **Teste uma variável**: Adicione um `console.log(process.env.GOOGLE_CLIENT_ID)` temporário

## 💡 Dica

Mantenha uma cópia das variáveis de ambiente em local seguro, pois o Portainer pode precisar ser reconfigurado.