# 📋 Instruções para Build das Imagens Docker

## 🚨 Problema Atual
Há um problema temporário de conectividade DNS que impede o download das imagens base do Docker Hub.

## 🔧 Soluções para Tentar

### 1. **Aguardar e Tentar Novamente**
O erro indica "geralmente é um erro temporário". Aguarde alguns minutos e tente:

```bash
# Testar conectividade
docker pull nginx:alpine

# Se funcionar, fazer builds:
docker build -f Dockerfile.frontend -t orickjogando/recrutamentoia-frontend:1.0.1 .
docker build -f Dockerfile.backend -t orickjogando/recrutamentoia-backend:1.0.1 .
```

### 2. **Reiniciar Docker Desktop**
1. Feche Docker Desktop completamente
2. Abra novamente
3. Aguarde inicialização completa
4. Tente novamente

### 3. **Configurar DNS no Docker Desktop**
1. Abra Docker Desktop Settings
2. Vá em "Docker Engine"
3. Adicione configuração DNS:
```json
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```
4. Apply & Restart

### 4. **Usar Hotspot Mobile (se disponível)**
Se o problema persistir, use conexão mobile temporariamente.

## 📦 Comandos Completos para Build

Quando a conectividade voltar:

```bash
# Frontend
docker build -f Dockerfile.frontend -t orickjogando/recrutamentoia-frontend:1.0.1 .
docker push orickjogando/recrutamentoia-frontend:1.0.1

# Backend  
docker build -f Dockerfile.backend -t orickjogando/recrutamentoia-backend:1.0.1 .
docker push orickjogando/recrutamentoia-backend:1.0.1
```

## ✅ Alterações Já Realizadas
- ✅ Dockerfile.frontend corrigido (nginx:alpine em vez de nginx:1.27-alpine)
- ✅ Sistema de provas teóricas sem tempo limite implementado
- ✅ Múltiplas provas por candidato implementado
- ✅ Frontend e backend compilados com sucesso

## 🔄 Status
- **Frontend**: Pronto para build (quando conectividade melhorar)
- **Backend**: Pronto para build (quando conectividade melhorar)
- **Sistema**: Totalmente funcional localmente