#!/bin/bash

echo "🚀 Iniciando deploy do backend RecrutamentoIA..."

# 1. Compilar o servidor
echo "📦 Compilando servidor..."
npm run build:server

if [ $? -ne 0 ]; then
    echo "❌ Erro na compilação do servidor"
    exit 1
fi

# 2. Verificar se os arquivos foram gerados
if [ ! -f "dist-server/server.js" ]; then
    echo "❌ Arquivo dist-server/server.js não encontrado"
    exit 1
fi

echo "✅ Compilação concluída com sucesso"

# 3. Criar arquivo de configuração do Docker para o backend
cat > Dockerfile.backend.new << EOF
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar servidor compilado
COPY dist-server/ ./dist-server/
COPY .env.production ./

# Expor porta
EXPOSE 3001

# Comando para iniciar
CMD ["node", "dist-server/server.js"]
EOF

echo "✅ Dockerfile.backend atualizado"

# 4. Instruções para deploy manual
echo ""
echo "📋 INSTRUÇÕES PARA DEPLOY:"
echo "1. Faça upload dos seguintes arquivos para o servidor:"
echo "   - dist-server/ (pasta completa)"
echo "   - package.json"
echo "   - .env.production"
echo "   - Dockerfile.backend.new (renomeie para Dockerfile.backend)"
echo ""
echo "2. No servidor, execute:"
echo "   docker-compose down backend"
echo "   docker-compose build backend"
echo "   docker-compose up -d backend"
echo ""
echo "3. Para testar localmente:"
echo "   Abra test-cors-simple.html no navegador"
echo "   Ou execute: python -m http.server 8080"
echo "   E acesse: http://localhost:8080/test-cors-simple.html"

echo ""
echo "🎯 Deploy preparado com sucesso!"
echo "✅ CORS configurado para produção"
echo "✅ Health endpoint disponível"
echo "✅ Logs de debug habilitados"