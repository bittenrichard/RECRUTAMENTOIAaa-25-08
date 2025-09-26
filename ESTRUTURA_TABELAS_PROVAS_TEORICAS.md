# ESTRUTURA DAS TABELAS BASEROW - SISTEMA DE PROVAS TEÓRICAS

## 📊 TABELAS NECESSÁRIAS

### 🗂️ TABELA 1: PROVAS_TEORICAS_MODELOS
**ID da Tabela:** 729 ✅ (já existe e funciona)

| Campo | Tipo | Obrigatório | Configuração |
|-------|------|-------------|--------------|
| id | Autonumber | Sim | Primary Key |
| titulo | Text | Sim | Nome do modelo |
| descricao | Long text | Não | Descrição |
| perguntas | Long text | Sim | JSON das questões |
| ativo | Boolean | Sim | Default: false |
| tempo_limite | Number | Sim | Minutos (ex: 60) |
| criado_por | Link to table | Não | Link para usuários |

**Exemplo de JSON no campo `perguntas`:**
```json
[
  {
    "id": "uuid-unique",
    "tipo": "multipla_escolha",
    "enunciado": "Qual é a capital do Brasil?",
    "opcoes": ["São Paulo", "Rio de Janeiro", "Brasília", "Belo Horizonte"],
    "resposta_correta": "Brasília",
    "pontuacao": 1
  },
  {
    "id": "uuid-unique-2", 
    "tipo": "verdadeiro_falso",
    "enunciado": "O Brasil tem 26 estados.",
    "resposta_correta": "Verdadeiro",
    "pontuacao": 1
  }
]
```

---

### 🗂️ TABELA 2: PROVAS_TEORICAS_APLICADAS
**ID da Tabela:** 730 ✅ (estrutura atual confirmada)

| Campo | Tipo | Obrigatório | Configuração |
|-------|------|-------------|--------------|
| id | Autonumber | Sim | Primary Key |
| candidato | Link to table | Sim | Link para CANDIDATOS |
| recrutador | Link to table | Não | Link para USUARIOS |
| modelo_da_prova | Link to table | Sim | Link para PROVAS_TEORICAS_MODELOS |
| status | Boolean | Sim | true = em andamento, false = finalizada/cancelada |
| data_de_geracao | Date | Sim | Data/hora de criação |
| data_de_resposta | Date | Não | Data/hora de finalização |
| respostas_candidato | Long text | Sim | JSON das respostas |
| pontuacao_total | Number | Não | Pontuação final |
| observacoes | Long text | Não | Observações |

**Lógica do campo `status` (Boolean):**
- `true` = Prova em andamento
- `false` = Prova finalizada ou cancelada

**Exemplo de JSON no campo `respostas_candidato`:**
```json
[
  {
    "questao_id": "uuid-da-questao-1",
    "resposta": "Brasília",
    "pontuacao_obtida": 1
  },
  {
    "questao_id": "uuid-da-questao-2",
    "resposta": "Verdadeiro", 
    "pontuacao_obtida": 1
  }
]
```

---

## 🔧 PASSOS PARA CRIAR A TABELA NO BASEROW

### 1. Criar nova tabela "PROVAS_TEORICAS_APLICADAS"
1. Acesse seu Baserow
2. Vá para o database do projeto
3. Clique em "Add table"
4. Nome: "PROVAS_TEORICAS_APLICADAS"
5. Anote o ID da tabela (será algo como 730, 731, etc.)

### 2. Adicionar campos um por um:

#### Campo: candidato_id
- Tipo: **Number**
- Nome: `candidato_id`
- Obrigatório: ✅ Sim

#### Campo: modelo_prova_id  
- Tipo: **Number**
- Nome: `modelo_prova_id`
- Obrigatório: ✅ Sim

#### Campo: questoes_respostas
- Tipo: **Long text**
- Nome: `questoes_respostas` 
- Obrigatório: ✅ Sim

#### Campo: status
- Tipo: **Single select**
- Nome: `status`
- Obrigatório: ✅ Sim
- **Opções (TODAS obrigatórias):**
  - `em_andamento` (cor verde)
  - `finalizada` (cor azul)
  - `cancelada` (cor vermelha)
  - `expirada` (cor laranja)

#### Campo: data_inicio
- Tipo: **Date**
- Nome: `data_inicio`
- Inclui hora: ✅ Sim
- Obrigatório: ✅ Sim

#### Campo: data_finalizacao
- Tipo: **Date** 
- Nome: `data_finalizacao`
- Inclui hora: ✅ Sim
- Obrigatório: ❌ Não

#### Campo: tempo_restante
- Tipo: **Number**
- Nome: `tempo_restante`
- Obrigatório: ✅ Sim

#### Campo: pontuacao_total
- Tipo: **Number**
- Nome: `pontuacao_total`
- Obrigatório: ❌ Não

#### Campo: observacoes
- Tipo: **Long text**
- Nome: `observacoes`
- Obrigatório: ❌ Não

---

## 🔄 ATUALIZAR CONSTANTES NO CÓDIGO

Após criar a tabela, atualize no arquivo `server.ts`:

```typescript
const PROVAS_TEORICAS_APLICADAS_TABLE_ID = 'SEU_ID_AQUI'; // Ex: '730'
```

---

## ✅ FLUXO COMPLETO DO SISTEMA

1. **Admin cria modelo** → Salva na tabela PROVAS_TEORICAS_MODELOS
2. **Gera link para candidato** → Cria registro na tabela PROVAS_TEORICAS_APLICADAS (status: em_andamento)
3. **Candidato responde** → Atualiza questoes_respostas via API
4. **Candidato finaliza** → Atualiza status para 'finalizada' + calcula pontuacao_total
5. **Admin vê resultados** → Consulta ambas tabelas para relatórios

---

## 🚨 ERROS IDENTIFICADOS E SOLUÇÕES

### Erro 404: URL_NOT_FOUND
**Problema:** Usando nome 'provas_teoricas' em vez de ID da tabela
**Solução:** ✅ Corrigido no código para usar PROVAS_TEORICAS_APLICADAS_TABLE_ID

### Erro 400: Invalid select option 'cancelado'
**Problema:** Campo status era Boolean, não Single Select
**Solução:** ✅ Adaptado código para usar Boolean (true/false)

### Adaptações Realizadas no Código:
✅ **Links Fields:** candidato e modelo_da_prova usam arrays de IDs
✅ **Status Boolean:** true = em andamento, false = finalizada
✅ **Campos Renomeados:** 
   - questoes_respostas → respostas_candidato
   - data_inicio → data_de_geracao  
   - data_finalizacao → data_de_resposta
   - nome → titulo (no modelo)

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

- [ ] Criar tabela PROVAS_TEORICAS_APLICADAS no Baserow
- [ ] Adicionar todos os campos conforme especificado
- [ ] Criar as 4 opções no campo status
- [ ] Anotar o ID da nova tabela
- [ ] Atualizar PROVAS_TEORICAS_APLICADAS_TABLE_ID no server.ts
- [ ] Fazer deploy das correções
- [ ] Testar geração de prova
- [ ] Testar cancelamento de prova