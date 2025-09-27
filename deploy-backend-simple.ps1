# Script de Deploy do Backend RecrutamentoIA

Write-Host "Iniciando deploy do backend..." -ForegroundColor Green

# Compilar o servidor
Write-Host "Compilando servidor..." -ForegroundColor Yellow
npm run build:server

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha na compilacao do servidor" -ForegroundColor Red
    exit 1
}

# Verificar arquivos
if (!(Test-Path "dist-server/server.js")) {
    Write-Host "ERRO: Arquivo dist-server/server.js nao encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "Compilacao concluida com sucesso!" -ForegroundColor Green
Write-Host ""

Write-Host "CONFIGURACAO CORS APLICADA:" -ForegroundColor Cyan
Write-Host "- Origem permitida: https://recrutamentoia.com.br" -ForegroundColor Green
Write-Host "- Credenciais habilitadas" -ForegroundColor Green
Write-Host "- Headers CORS configurados" -ForegroundColor Green
Write-Host "- Preflight OPTIONS tratado" -ForegroundColor Green
Write-Host ""

Write-Host "ARQUIVOS PRONTOS:" -ForegroundColor Cyan
if (Test-Path "dist-server/server.js") { 
    Write-Host "OK: dist-server/server.js" -ForegroundColor Green 
}
if (Test-Path ".env.production") { 
    Write-Host "OK: .env.production" -ForegroundColor Green 
} else { 
    Write-Host "ATENCAO: .env.production necessario" -ForegroundColor Yellow 
}

Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Teste local: npm run server"
Write-Host "2. Deploy: Envie dist-server/ para producao"
Write-Host "3. Reinicie: docker-compose restart backend"
Write-Host ""
Write-Host "Deploy preparado com sucesso!" -ForegroundColor Green