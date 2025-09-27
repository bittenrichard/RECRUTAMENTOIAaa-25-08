// Servidor HTTP básico do Node.js (sem dependências externas)
import http from 'http';
import { URL } from 'url';

const PORT = 8080;

console.log('🔧 Iniciando servidor HTTP básico do Node.js...');

const server = http.createServer((req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Servidor HTTP básico funcionando!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.on('error', (error) => {
  console.error('❌ Erro no servidor:', error);
});

server.listen(PORT, () => {
  console.log(`✅ Servidor HTTP básico rodando na porta ${PORT}`);
  console.log(`🌐 Teste: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Parando servidor...');
  server.close(() => {
    console.log('✅ Servidor parado');
    process.exit(0);
  });
});