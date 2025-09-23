# 🚨 CORREÇÕES APLICADAS - Deploy Urgente

## Problemas Corrigidos:

### ✅ 1. Upload de Vídeo (Erro 413)
- **Aumentado limite de upload para 100MB**
- Multer configurado para aceitar arquivos até 100MB
- Express configurado com limite de 100MB
- Validação de tipos de arquivo (MP4, WebM, MOV, AVI)
- Melhor tratamento de erros

### ✅ 2. Teste Comportamental (Erro 405)  
- Rota `/api/behavioral-test/generate` verificada e corrigida
- Logging adicionado para debug
- Validações melhoradas

### ✅ 3. Backend não respondendo (Erro 404)
- Adicionada rota de health check: `/health`
- Adicionada rota raiz: `/` 
- Logging melhorado para debug

## 🚀 Instruções de Deploy:

### 1. Construir nova imagem:
```bash
docker build -f Dockerfile.backend -t orickjogando/recrutamentoia-backend:1.0.1 .
```

### 2. Fazer push:
```bash
docker push orickjogando/recrutamentoia-backend:1.0.1
```

### 3. No Portainer:
1. Parar o container atual
2. Atualizar imagem para `orickjogando/recrutamentoia-backend:1.0.1`
3. Garantir que todas as variáveis de ambiente estão configuradas
4. Iniciar o container

### 4. Verificar funcionamento:
```bash
# Health check
curl https://backend.recrutamentoia.com.br/health

# Rota raiz
curl https://backend.recrutamentoia.com.br/

# Teste da API
curl https://backend.recrutamentoia.com.br/api/users/1
```

## 🔧 Configurações Importantes:

### Limites de Upload:
- **Multer**: 100MB por arquivo
- **Express**: 100MB para JSON/form-data
- **Nginx** (se aplicável): Aumentar `client_max_body_size`

### Variáveis de Ambiente Críticas:
```
NODE_ENV=production
PORT=3001
VITE_BASEROW_API_KEY=anGucsRrFCKrOmUYHapVYsr5U3FVK85o
TESTE_COMPORTAMENTAL_WEBHOOK_URL=https://webhook.focoserv.com.br/webhook/testecomportamental
```

### Proxy Reverso (Nginx):
Se usando Nginx, adicionar:
```nginx
client_max_body_size 100M;
proxy_read_timeout 300;
proxy_connect_timeout 300;
proxy_send_timeout 300;
```

## 📊 Logs para Monitorar:

Após o deploy, verificar os logs:
```bash
docker logs [container-name] --tail 50 -f
```

Procurar por:
- ✅ `🚀 Backend rodando em PRODUÇÃO`
- ✅ `📡 Porta: 3001`
- ✅ `🗄️ Baserow API: Configurado`
- ✅ `🤖 N8N Webhooks: Configurado`

## 🆘 Se ainda houver problemas:

1. Verificar se o container está rodando
2. Verificar logs do container
3. Testar health check
4. Verificar DNS/proxy reverso
5. Verificar variáveis de ambiente

## 📞 Teste das Funcionalidades:

Após deploy:
1. ✅ Teste upload de vídeo (até 100MB)
2. ✅ Teste geração de perfil comportamental  
3. ✅ Verificar se backend responde no navegador