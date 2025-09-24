# Sistema de Provas Teóricas

Este módulo implementa um sistema completo de provas teóricas para avaliação de candidatos, incluindo criação de modelos, aplicação de testes e análise de resultados.

## Estrutura da Feature

```
src/features/theoretical/
├── components/
│   ├── TheoreticalModelsPage.tsx    # Gestão de modelos de prova
│   ├── TestModelForm.tsx            # Formulário de criação/edição
│   └── TheoreticalTestPage.tsx      # Interface para candidatos
├── hooks/
│   └── useTheoreticalTests.ts       # Hook principal da feature
└── index.ts                         # Exportações da feature
```

## Funcionalidades Implementadas

### 🔧 Backend (server.ts)

- **CRUD de Modelos de Prova**: `/api/theoretical-models`
  - `GET /api/theoretical-models` - Listar modelos
  - `GET /api/theoretical-models/:id` - Buscar modelo específico
  - `POST /api/theoretical-models` - Criar novo modelo
  - `PUT /api/theoretical-models/:id` - Atualizar modelo
  - `DELETE /api/theoretical-models/:id` - Deletar modelo

- **Aplicação de Testes**: `/api/theoretical-test`
  - `POST /api/theoretical-test/generate` - Gerar prova para candidato
  - `GET /api/theoretical-test/:candidateId` - Buscar prova em andamento
  - `PUT /api/theoretical-test/:testId/submit` - Submeter respostas
  - `GET /api/theoretical-test/results/:candidateId` - Buscar resultados

### 🎨 Frontend

#### Componentes Administrativos
- **TheoreticalModelsPage**: Interface para listar, criar, editar e deletar modelos
- **TestModelForm**: Editor avançado de questões com suporte a:
  - Verdadeiro/Falso
  - Múltipla Escolha (com opções dinâmicas)
  - Dissertativa (avaliação manual)

#### Interface do Candidato
- **TheoreticalTestPage**: Prova interativa com:
  - Timer em tempo real
  - Navegação entre questões
  - Indicadores de progresso
  - Submissão segura

## Tipos de Questões Suportados

### 1. Verdadeiro/Falso
```typescript
{
  tipo: 'verdadeiro_falso',
  enunciado: 'A Terra é redonda.',
  resposta_correta: 'verdadeiro',
  pontuacao: 1
}
```

### 2. Múltipla Escolha
```typescript
{
  tipo: 'multipla_escolha',
  enunciado: 'Qual é a capital do Brasil?',
  opcoes: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Belo Horizonte'],
  resposta_correta: 'Brasília',
  pontuacao: 2
}
```

### 3. Dissertativa
```typescript
{
  tipo: 'dissertativa',
  enunciado: 'Explique os principais conceitos de programação orientada a objetos.',
  pontuacao: 5
  // resposta_correta não aplicável - avaliação manual
}
```

## Como Usar

### 1. Importar Componentes
```typescript
import {
  TheoreticalModelsPage,
  TestModelForm,
  TheoreticalTestPage,
  useTheoreticalTests
} from '../features/theoretical';
```

### 2. Usar Hook Principal
```typescript
const {
  models,
  loading,
  error,
  fetchModels,
  createModel,
  updateModel,
  deleteModel,
  generateTest,
  getCandidateTest,
  submitTest
} = useTheoreticalTests();
```

### 3. Implementar Páginas Administrativas
```typescript
// Página de gestão de modelos
<TheoreticalModelsPage
  onCreateModel={() => setShowCreateForm(true)}
  onEditModel={(model) => setEditingModel(model)}
  onViewResults={(modelId) => navigate(`/results/${modelId}`)}
/>

// Formulário de modelo
{showCreateForm && (
  <TestModelForm
    model={editingModel}
    onSave={handleSaveModel}
    onCancel={() => setShowCreateForm(false)}
  />
)}
```

### 4. Implementar Interface do Candidato
```typescript
<TheoreticalTestPage
  candidateId={candidateId}
  onTestCompleted={(score) => handleTestCompleted(score)}
  onTestNotFound={() => navigate('/candidate-dashboard')}
/>
```

## Integração com Sistema Existente

### 1. Adicionar ao Roteamento (App.tsx)
```typescript
import { TheoreticalModelsPage, TheoreticalTestPage } from './features/theoretical';

// Rotas administrativas
<Route path="/theoretical-models" element={<TheoreticalModelsPage />} />

// Rotas do candidato
<Route path="/theoretical-test/:candidateId" element={<TheoreticalTestPage />} />
```

### 2. Adicionar ao Menu/Dashboard
```typescript
// Menu administrativo
<Link to="/theoretical-models">
  <FileText className="w-5 h-5" />
  Provas Teóricas
</Link>

// Dashboard do candidato
<Link to={`/theoretical-test/${candidateId}`}>
  <Clock className="w-5 h-5" />
  Realizar Prova Teórica
</Link>
```

### 3. Integrar com Fluxo de Candidatos
```typescript
// Gerar prova automaticamente quando candidato atingir status
const generateTheoreticalTest = async (candidateId: string, modelId: string) => {
  const { generateTest } = useTheoreticalTests();
  
  try {
    await generateTest(candidateId, modelId);
    // Redirecionar ou notificar candidato
  } catch (error) {
    console.error('Erro ao gerar prova:', error);
  }
};
```

## Configuração do Ambiente

### Variáveis de Ambiente Necessárias
```env
# Baserow - Tabelas das provas teóricas
PROVAS_TEORICAS_MODELOS_TABLE_ID=729
PROVAS_TEORICAS_APLICADAS_TABLE_ID=730

# N8N - Webhook para notificações
N8N_THEORETICAL_WEBHOOK_URL=https://seu-n8n.com/webhook/theoretical-test
```

### Estrutura das Tabelas Baserow

#### Tabela: Modelos de Prova (ID: 729)
- `nome` (Texto): Nome do modelo
- `descricao` (Texto longo): Descrição detalhada
- `tempo_limite` (Número): Tempo em minutos
- `questoes` (Texto longo): JSON das questões
- `ativo` (Booleano): Se o modelo está ativo
- `created_at` (Data): Data de criação
- `updated_at` (Data): Data da última atualização

#### Tabela: Provas Aplicadas (ID: 730)
- `candidato_id` (Texto): ID do candidato
- `modelo_prova_id` (Texto): ID do modelo usado
- `questoes_respostas` (Texto longo): JSON das respostas
- `pontuacao_total` (Número): Pontuação calculada
- `status` (Seleção): em_andamento | finalizada | expirada
- `data_inicio` (Data): Início da prova
- `data_finalizacao` (Data): Finalização da prova
- `tempo_restante` (Número): Tempo restante em minutos

## Notificações N8N

O sistema envia webhooks para N8N em dois momentos:

1. **Prova Gerada**: Quando uma prova é criada para um candidato
2. **Prova Finalizada**: Quando um candidato submete suas respostas

### Payload dos Webhooks
```json
// Prova gerada
{
  "action": "prova_gerada",
  "candidato": {
    "id": "123",
    "nome": "João Silva",
    "email": "joao@email.com"
  },
  "prova": {
    "id": "456",
    "nome_modelo": "Prova de Conhecimentos Gerais",
    "tempo_limite": 60
  }
}

// Prova finalizada
{
  "action": "prova_finalizada",
  "candidato": {
    "id": "123",
    "nome": "João Silva", 
    "email": "joao@email.com"
  },
  "prova": {
    "id": "456",
    "nome_modelo": "Prova de Conhecimentos Gerais",
    "pontuacao_total": 8.5,
    "data_finalizacao": "2024-01-15T10:30:00.000Z"
  }
}
```

## Status da Implementação

✅ **Concluído:**
- Backend endpoints completos
- Tipos TypeScript
- Hook useTheoreticalTests
- Componente de gestão de modelos
- Formulário de criação/edição
- Interface do candidato
- Timer e navegação
- Submissão de respostas
- Integração com Baserow
- Webhooks N8N

🔄 **Próximos Passos Sugeridos:**
- Página de resultados detalhados
- Dashboard de estatísticas
- Relatórios de desempenho
- Sistema de templates de questões
- Importação/exportação de modelos
- Correção assistida para dissertativas

## Suporte e Manutenção

Para questões técnicas ou melhorias, consulte:
- Documentação da API no server.ts
- Tipos TypeScript em src/shared/types/index.ts
- Testes unitários (quando implementados)