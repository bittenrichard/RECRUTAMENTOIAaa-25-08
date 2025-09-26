import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

// Middleware básico
app.use(express.json());
app.use(cors({ origin: '*' }));

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Servidor funcionando!' });
});

// Rota de modelos teóricos (simplificada)
app.get('/api/theoretical-models', (req, res) => {
  res.json({ 
    success: true, 
    data: [
      {
        id: '1',
        nome: 'Teste Modelo',
        tempo_limite: 60,
        questoes: JSON.stringify([
          { id: 1, pergunta: 'Teste?', tipo: 'multipla_escolha' }
        ])
      }
    ]
  });
});

app.listen(port, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${port}`);
  console.log('✅ Pronto para testes!');
}).on('error', (err) => {
  console.error('❌ Erro:', err.message);
});

console.log('📝 Iniciando servidor de teste...');