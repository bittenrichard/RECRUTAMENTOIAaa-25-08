@echo off
echo Iniciando servidor em modo PRODUCAO...

REM Definir explicitamente o NODE_ENV
set NODE_ENV=production

REM Verificar se os arquivos existem
if not exist ".env.production" (
    echo ERRO: Arquivo .env.production nao encontrado!
    pause
    exit /b 1
)

if not exist "dist-server\server.js" (
    echo ERRO: Servidor nao foi compilado. Execute 'npm run build:server' primeiro.
    pause
    exit /b 1
)

echo Carregando variaveis de ambiente de .env.production...
echo NODE_ENV=%NODE_ENV%

REM Executar o servidor
echo Iniciando servidor na porta 3001...
node dist-server\server.js

pause