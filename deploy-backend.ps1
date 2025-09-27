# Script de Deploy do Backend RecrutamentoIA
# PowerShell Version

Write-Host "🚀 Iniciando deploy do backend RecrutamentoIA..." -ForegroundColor Green

# 1. Compilar o servidor
Write-Host "📦 Compilando servidor..." -ForegroundColor Yellow
npm run build:server

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro na compilação do servidor" -ForegroundColor Red
    exit 1
}

# 2. Verificar se os arquivos foram gerados
if (!(Test-Path "dist-server/server.js")) {
    Write-Host "❌ Arquivo dist-server/server.js não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Compilação concluída com sucesso" -ForegroundColor Green

# 3. Criar resumo da configuração CORS
Write-Host ""
Write-Host "🔒 CONFIGURAÇÃO CORS APLICADA:" -ForegroundColor Cyan
Write-Host "✅ Origem permitida: https://recrutamentoia.com.br" -ForegroundColor Green
Write-Host "✅ Credenciais habilitadas" -ForegroundColor Green
Write-Host "✅ Headers configurados corretamente" -ForegroundColor Green
Write-Host "✅ Preflight (OPTIONS) tratado" -ForegroundColor Green

# 4. Testar servidor localmente
Write-Host ""
Write-Host "🧪 TESTES DISPONÍVEIS:" -ForegroundColor Cyan
Write-Host "1. Servidor local: npm run server" -ForegroundColor White
Write-Host "2. Health check: curl http://localhost:3001/api/health" -ForegroundColor White
Write-Host "3. Teste CORS: Abrir test-cors-simple.html no navegador" -ForegroundColor White

# 5. Instruções para produção
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS PARA PRODUÇÃO:" -ForegroundColor Yellow
Write-Host "1. Faça upload da pasta dist-server/ para o servidor" -ForegroundColor White
Write-Host "2. Atualize o arquivo .env.production no servidor" -ForegroundColor White
Write-Host "3. Reinicie o container do backend:" -ForegroundColor White
Write-Host "   docker-compose restart backend" -ForegroundColor Gray

Write-Host ""
Write-Host "🎯 Deploy preparado com sucesso!" -ForegroundColor Green

# 6. Verificar arquivos importantes
Write-Host ""
Write-Host "📁 ARQUIVOS PRONTOS PARA DEPLOY:" -ForegroundColor Cyan
if (Test-Path "dist-server/server.js") {
    Write-Host "✅ dist-server/server.js" -ForegroundColor Green
} else {
    Write-Host "❌ dist-server/server.js" -ForegroundColor Red
}

if (Test-Path ".env.production") {
    Write-Host "✅ .env.production" -ForegroundColor Green
} else {
    Write-Host "❌ .env.production (arquivo necessário)" -ForegroundColor Red
}

if (Test-Path "test-cors-simple.html") {
    Write-Host "✅ test-cors-simple.html (para testes)" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 DICA: Execute npm run server para testar localmente antes do deploy" -ForegroundColor Blue