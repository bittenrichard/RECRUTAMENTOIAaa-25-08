# Script para iniciar o servidor em produção com as variáveis corretas

Write-Host "🚀 Iniciando servidor RecrutamentoIA em PRODUÇÃO..." -ForegroundColor Green

# Definir explicitamente o ambiente
$env:NODE_ENV = "production"

# Compilar o servidor
Write-Host "📦 Compilando servidor..." -ForegroundColor Yellow
npm run build:server

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro na compilação" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Compilação concluída!" -ForegroundColor Green

# Verificar se arquivo .env.production existe
if (Test-Path ".env.production") {
    Write-Host "✅ Arquivo .env.production encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Arquivo .env.production não encontrado" -ForegroundColor Red
    exit 1
}

# Iniciar servidor
Write-Host "🌟 Iniciando servidor em produção..." -ForegroundColor Cyan
Write-Host "📍 Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow

node -r dotenv/config ./dist-server/server.js dotenv_config_path=.env.production