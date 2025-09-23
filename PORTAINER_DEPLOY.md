# Configuração para Deploy no Portainer

## Variáveis de Ambiente Obrigatórias

Configure estas variáveis no Portainer para o container do backend:

### 🌍 Ambiente
```
NODE_ENV=production
PORT=3001
```

### 🔗 URLs
```
FRONTEND_URL=https://recrutamentoia.com.br
BACKEND_URL=https://backend.recrutamentoia.com.br
```

### 🔐 Autenticação
```
JWT_SECRET=ALTERE_ESTE_JWT_SECRET_EM_PRODUCAO_PARA_ALGO_MUITO_SEGURO_E_COMPLEXO_recrutamentoia_2024
```

### 🗄️ Baserow API
```
BASEROW_TOKEN=anGucsRrFCKrOmUYHapVYsr5U3FVK85o
BASEROW_API_TOKEN=anGucsRrFCKrOmUYHapVYsr5U3FVK85o
VITE_BASEROW_API_KEY=anGucsRrFCKrOmUYHapVYsr5U3FVK85o
```

### 🌐 Google Calendar OAuth
```
GOOGLE_CLIENT_ID=726048519835-4o31uj1ssftc47a08kcb8hs1hkm2v040.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://backend.recrutamentoia.com.br/api/google/auth/callback
```

### 🔗 Frontend
```
VITE_API_BASE_URL=https://backend.recrutamentoia.com.br
```

### 🤖 Webhooks N8N
```
N8N_FILE_UPLOAD_URL=https://webhook.focoserv.com.br/webhook/recrutamento
N8N_SCHEDULE_WEBHOOK_URL=https://webhook.focoserv.com.br/webhook/googleacesso
N8N_EMAIL_WEBHOOK_URL=https://webhook.focoserv.com.br/webhook/email-reset
TESTE_COMPORTAMENTAL_WEBHOOK_URL=https://webhook.focoserv.com.br/webhook/testecomportamental
```

### 🛡️ Segurança
```
TRUST_PROXY=true
SECURE_COOKIES=true
```

### 📊 Logging
```
LOG_LEVEL=info
```

## 🐳 Configuração do Container

### Portas
- **Porta interna**: 3001
- **Porta externa**: Conforme sua configuração de reverse proxy

### Volume (opcional)
Se quiser persistir logs:
```
/app/logs:/var/logs/app
```

### Health Check
```bash
curl --fail http://localhost:3001/api/users/1 || exit 1
```

## 📝 Checklist de Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Container com acesso à internet para webhooks
- [ ] DNS apontando para o container (backend.recrutamentoia.com.br)
- [ ] SSL/TLS configurado no reverse proxy
- [ ] Firewall liberado para portas necessárias

## 🔧 Troubleshooting

### Logs importantes:
```bash
docker logs [container-name] --tail 50 -f
```

### Validação de variáveis:
O servidor irá mostrar no log quais variáveis estão configuradas/faltando ao iniciar.

### Teste de conectividade:
```bash
curl -X GET https://backend.recrutamentoia.com.br/api/users/1
```

## 🚀 Comandos Úteis

### Build da imagem:
```bash
docker build -t recrutamento-backend .
```

### Rodar localmente para teste:
```bash
docker run --env-file .env.production -p 3001:3001 recrutamento-backend
```