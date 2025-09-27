echo "Iniciando servidor em producao..."
set NODE_ENV=production
npm run build:server
node -r dotenv/config ./dist-server/server.js dotenv_config_path=.env.production