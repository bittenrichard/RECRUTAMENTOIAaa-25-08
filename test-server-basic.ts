// Servidor de teste básico para debug
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

console.log('🧪 Iniciando servidor de teste básico...');

// Middleware básico
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Rota de teste básica
app.get('/', (req, res) => {
  console.log('📥 Recebida requisição GET /');
  res.json({ message: 'Servidor de teste funcionando!', timestamp: new Date().toISOString() });
});

// Rota de health check
app.get('/health', (req, res) => {
  console.log('📊 Recebida requisição GET /health');
  res.json({ status: 'OK', server: 'test-server' });
});

// Handler de erro global
app.use((error, req, res, next) => {
  console.error('❌ Erro capturado:', error);
  res.status(500).json({ error: error.message });
});

// Handler para rotas não encontradas
app.use('*', (req, res) => {
  console.log(`⚠️  Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Rota não encontrada' });
});

try {
  app.listen(PORT, () => {
    console.log(`✅ Servidor de teste rodando na porta ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
  });
} catch (error) {
  console.error('❌ Erro ao iniciar servidor:', error);
}