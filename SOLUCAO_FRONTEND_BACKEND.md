# 🚨 SOLUÇÃO PARA ERROS DO FRONTEND

## Problema Identificado:
O **frontend está fazendo requisições para `https://recrutamentoia.com.br`** em vez de **`https://backend.recrutamentoia.com.br`**.

### ✅ Backend Testado e Funcionando:
- ✅ Health check: `https://backend.recrutamentoia.com.br/health`
- ✅ Teste comportamental: `https://backend.recrutamentoia.com.br/api/behavioral-test/generate`
- ✅ Upload de vídeo: `https://backend.recrutamentoia.com.br/api/candidates/139/video-interview`

## 🔧 SOLUÇÕES:

### **1. Problema Principal: Configuração do Proxy/DNS**

O frontend precisa ser configurado para usar as URLs corretas. Existem duas abordagens:

#### **Opção A: Nginx como Proxy (Recomendado)**
Use o arquivo `nginx-recrutamentoia.conf` criado para configurar o Nginx como proxy reverso.

**Configuração:**
```nginx
# Frontend (recrutamentoia.com.br) → Arquivos estáticos
# Backend (backend.recrutamentoia.com.br) → API container
```

#### **Opção B: Configurar Proxy Interno no Nginx**
Configure o nginx para rotear `/api/*` para o backend:

```nginx
server {
    server_name recrutamentoia.com.br;
    
    # Frontend static files
    location / {
        root /var/www/html;
        try_files $uri /index.html;
    }
    
    # API routes para o backend
    location /api/ {
        proxy_pass https://backend.recrutamentoia.com.br;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Upload configuration
        client_max_body_size 100M;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}
```

### **2. Rebuild do Frontend**

Se você quiser que o frontend aponte diretamente para o backend:

```bash
# 1. Verifique as variáveis de ambiente
cat .env.production

# 2. Rebuilde o frontend com as variáveis corretas
VITE_API_BASE_URL=https://backend.recrutamentoia.com.br npm run build

# 3. Deploy dos arquivos estáticos atualizados
```

### **3. Verificação das Variáveis**

Confirme que o arquivo `.env.production` tem:
```bash
VITE_API_BASE_URL=https://backend.recrutamentoia.com.br
```

## 🚀 IMPLEMENTAÇÃO RÁPIDA:

### **Para Resolver AGORA:**

1. **Configure nginx com proxy interno:**
   ```nginx
   location /api/ {
       proxy_pass https://backend.recrutamentoia.com.br;
       client_max_body_size 100M;
       proxy_connect_timeout 600s;
       proxy_send_timeout 600s;
       proxy_read_timeout 600s;
   }
   ```

2. **Reinicie o nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### **Para Solução Definitiva:**

1. Use a configuração completa do `nginx-recrutamentoia.conf`
2. Configure DNS para `backend.recrutamentoia.com.br`
3. Configure SSL para ambos os domínios

## 🧪 TESTES:

Após a configuração, teste:

```bash
# 1. Teste direto do backend
curl https://backend.recrutamentoia.com.br/health

# 2. Teste através do proxy
curl https://recrutamentoia.com.br/api/health

# 3. Teste upload (com arquivo pequeno)
curl -X POST https://recrutamentoia.com.br/api/behavioral-test/generate \
  -H "Content-Type: application/json" \
  -d '{"candidateId": 139, "recruiterId": 1}'
```

## 📋 CHECKLIST:

- [ ] Nginx configurado com proxy para /api/
- [ ] client_max_body_size 100M configurado
- [ ] Timeouts estendidos para uploads
- [ ] DNS/SSL configurado para backend.recrutamentoia.com.br
- [ ] Testes realizados com sucesso

## 🆘 SE AINDA NÃO FUNCIONAR:

1. Verifique logs do nginx: `tail -f /var/log/nginx/error.log`
2. Verifique se o container backend está rodando
3. Teste as URLs diretamente no backend
4. Verifique se o firewall não está bloqueando