# 🗄️ Estrutura do Banco de Dados - Auto-Match v1.1

> **Para implementação manual no Baserow**  
> **Data:** 1 de outubro de 2025  
> **Versão:** 1.1  

---

## 📋 **TABELAS NECESSÁRIAS**

### 🔧 **1. TABELA: auto_match_configs**

**Nome da Tabela:** `auto_match_configs`  
**Descrição:** Configurações personalizadas de auto-match por usuário

#### **Colunas:**

| Nome da Coluna | Tipo no Baserow | Obrigatório | Valor Padrão | Descrição |
|----------------|-----------------|-------------|--------------|-----------|
| `id` | Number | ✅ Sim | Auto-increment | ID único da configuração |
| `user_id` | Number | ✅ Sim | - | ID do usuário (referência para tabela users) |
| `criteria_weights` | Long text | ❌ Não | `{}` | JSON com pesos dos critérios de match |
| `minimum_score` | Number | ❌ Não | `70` | Score mínimo para considerar um match |
| `auto_actions_enabled` | Checkbox | ❌ Não | `true` | Se ações automáticas estão ativadas |
| `created_at` | Date | ✅ Sim | Data atual | Data de criação |
| `updated_at` | Date | ✅ Sim | Data atual | Data da última atualização |

#### **Configurações Especiais:**
- **criteria_weights** - Exemplo de conteúdo JSON:
```json
{
  "idade": {"weight": 10, "required": false, "enabled": true},
  "escolaridade": {"weight": 25, "required": true, "enabled": true},
  "experiencia_anos": {"weight": 30, "required": false, "enabled": true},
  "localizacao": {"weight": 15, "required": false, "enabled": true},
  "habilidades": {"weight": 20, "required": false, "enabled": true},
  "pretensao_salarial": {"weight": 20, "required": false, "enabled": true}
}
```

---

### 🎯 **2. TABELA: auto_match_results**

**Nome da Tabela:** `auto_match_results`  
**Descrição:** Resultados dos matches automáticos gerados

#### **Colunas:**

| Nome da Coluna | Tipo no Baserow | Obrigatório | Valor Padrão | Descrição |
|----------------|-----------------|-------------|--------------|-----------|
| `id` | Number | ✅ Sim | Auto-increment | ID único do resultado |
| `job_id` | Number | ✅ Sim | - | ID da vaga (referência para tabela jobs) |
| `candidate_id` | Number | ✅ Sim | - | ID do candidato (referência para tabela candidates) |
| `compatibility_score` | Number | ✅ Sim | - | Score de compatibilidade (0-100) |
| `match_reasons` | Long text | ❌ Não | `[]` | JSON com razões do match |
| `suggested_status` | Text | ❌ Não | `triagem` | Status sugerido para o candidato |
| `auto_actions` | Long text | ❌ Não | `[]` | JSON com ações automáticas sugeridas |
| `executed_at` | Date | ❌ Não | - | Data de execução das ações |
| `created_at` | Date | ✅ Sim | Data atual | Data de criação do match |

#### **Configurações Especiais:**
- **match_reasons** - Exemplo de conteúdo JSON:
```json
[
  "5 anos de experiência na área",
  "Ensino superior completo",
  "Mesma localização da vaga",
  "Pretensão salarial compatível"
]
```

- **auto_actions** - Exemplo de conteúdo JSON:
```json
[
  {
    "type": "whatsapp",
    "priority": "high",
    "suggestedTime": "+2 hours",
    "message": "Candidato excepcional encontrado",
    "template": "whatsapp_match_premium"
  },
  {
    "type": "interview",
    "priority": "medium", 
    "suggestedTime": "+1 day",
    "message": "Agendar entrevista inicial",
    "template": "interview_invitation"
  }
]
```

- **suggested_status** - Valores possíveis:
  - `triagem`
  - `entrevista_agendada`
  - `entrevista_realizada`
  - `aprovado`
  - `contato_inicial`

---

### 📊 **3. TABELA: auto_match_analytics**

**Nome da Tabela:** `auto_match_analytics`  
**Descrição:** Analytics e métricas dos auto-matches por vaga

#### **Colunas:**

| Nome da Coluna | Tipo no Baserow | Obrigatório | Valor Padrão | Descrição |
|----------------|-----------------|-------------|--------------|-----------|
| `id` | Number | ✅ Sim | Auto-increment | ID único do analytics |
| `job_id` | Number | ✅ Sim | - | ID da vaga (referência para tabela jobs) |
| `total_candidates_scanned` | Number | ✅ Sim | `0` | Total de candidatos analisados |
| `matches_found` | Number | ✅ Sim | `0` | Total de matches encontrados |
| `matches_contacted` | Number | ❌ Não | `0` | Matches que foram contatados |
| `matches_advanced` | Number | ❌ Não | `0` | Matches que avançaram no processo |
| `time_saved_hours` | Number | ❌ Não | `0` | Tempo economizado em horas (decimal) |
| `created_at` | Date | ✅ Sim | Data atual | Data de criação do analytics |

#### **Configurações Especiais:**
- **time_saved_hours** - Usar tipo Number com 2 casas decimais
- Exemplo: `2.5` = 2 horas e 30 minutos economizados

---

## 🔗 **RELACIONAMENTOS ENTRE TABELAS**

### **auto_match_configs**
- `user_id` → referencia `users.id`

### **auto_match_results**  
- `job_id` → referencia `jobs.id`
- `candidate_id` → referencia `candidates.id`

### **auto_match_analytics**
- `job_id` → referencia `jobs.id`

---

## 📝 **INSTRUÇÕES DE CRIAÇÃO NO BASEROW**

### **Passo a Passo:**

1. **Criar Tabela auto_match_configs:**
   - Ir em "Criar nova tabela"
   - Nome: `auto_match_configs`
   - Adicionar as 7 colunas conforme especificado
   - Configurar tipos de dados corretamente
   - Definir valores padrão onde indicado

2. **Criar Tabela auto_match_results:**
   - Ir em "Criar nova tabela" 
   - Nome: `auto_match_results`
   - Adicionar as 9 colunas conforme especificado
   - Campos JSON usar tipo "Long text"
   - Configurar valores padrão

3. **Criar Tabela auto_match_analytics:**
   - Ir em "Criar nova tabela"
   - Nome: `auto_match_analytics` 
   - Adicionar as 8 colunas conforme especificado
   - Campo time_saved_hours usar Number com decimais

4. **Configurar Relacionamentos:**
   - Nas configurações de cada coluna de referência
   - Definir como "Link to table" 
   - Escolher a tabela de destino correta

---

## 🎯 **CAMPOS IMPORTANTES PARA FUNCIONALIDADE**

### **Critérios de Match (criteria_weights):**
Os seguintes critérios devem estar no JSON de configuração:

- `idade` - Compatibilidade de idade
- `genero` - Preferência de gênero  
- `localizacao` - Proximidade geográfica
- `escolaridade` - Nível educacional
- `experiencia_anos` - Anos de experiência
- `area_experiencia` - Área de atuação
- `habilidades` - Skills técnicas
- `certificacoes` - Certificações profissionais
- `idiomas` - Conhecimento de idiomas
- `perfil_comportamental` - Perfil psicológico
- `score_anterior` - Performance em processos anteriores
- `modalidade_trabalho` - Presencial/Remoto/Híbrido
- `pretensao_salarial` - Expectativa salarial
- `disponibilidade` - Disponibilidade para início

### **Ações Automáticas (auto_actions):**
Tipos de ação possíveis:

- `whatsapp` - Enviar mensagem WhatsApp
- `email` - Enviar email
- `call` - Fazer ligação telefônica
- `interview` - Agendar entrevista
- `add_to_job` - Adicionar candidato à vaga

### **Prioridades:**
- `high` - Alta prioridade (matches excelentes 90%+)
- `medium` - Média prioridade (matches bons 80-89%)
- `low` - Baixa prioridade (matches regulares 70-79%)

---

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO**

- [ ] Criar tabela `auto_match_configs`
- [ ] Criar tabela `auto_match_results`  
- [ ] Criar tabela `auto_match_analytics`
- [ ] Configurar relacionamentos entre tabelas
- [ ] Testar inserção de dados de exemplo
- [ ] Validar estrutura JSON dos campos Long text
- [ ] Configurar valores padrão corretos
- [ ] Verificar permissões de acesso às tabelas

---

> **⚠️ IMPORTANTE:** Após criar as tabelas, anote os IDs das tabelas gerados pelo Baserow, pois serão necessários para configurar as APIs no backend.

**Próximo Passo:** Implementar APIs backend para integração com essas tabelas.