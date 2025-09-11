# Plano de Execução - Entrevista por Vídeo e Banco de Talentos

## ✅ Fase 1: Estrutura Básica no Baserow
- [x] ~~Adicionar campo `video_entrevista` (Arquivo ou URL) na tabela de candidatos.~~
- [x] ~~Adicionar campo `status_video` (Seleção Única) na tabela de candidatos.~~
- [x] ~~Adicionar campo `ultima_atualizacao` (Data/Hora) na tabela de candidatos.~~
- [x] ~~Adicionar campo `status` (Seleção Única) na tabela de candidatos, se necessário.~~
- [x] ~~Adicionar campos de automação na tabela de usuários: `automacao_inativacao` (Booleano) e `periodo_inativacao_meses` (Número).~~
- [x] ~~Criar tipos TypeScript para os novos campos no arquivo `src/shared/types/index.ts`.~~
- [x] ~~Atualizar interface `Candidate` com os novos campos.~~
- [x] ~~Corrigir importações em todos os componentes.~~

## ✅ Fase 2: Upload e Visualização de Vídeo
- [x] ~~Adicionar colunas de vídeo na tabela de candidatos (desktop e mobile).~~
- [x] ~~Criar modal de upload de vídeo (VideoUploadModal.tsx).~~
- [x] ~~Adicionar botões de upload de vídeo na tabela e cards mobile.~~
- [x] ~~Conectar ao endpoint backend existente `/api/candidates/:candidateId/video-interview`.~~
- [x] ~~Implementar validação de formato e tamanho do vídeo no frontend.~~
- [ ] **Testando:** Salvar o vídeo no campo `video_entrevista` do candidato.
- [ ] **Testando:** Exibir player de vídeo funcional para a equipe visualizar.
- [ ] Atualizar `status_video` conforme o fluxo de aprovação/reprovação.

## ✅ Fase 3: Indicador e Atualização Manual
- [x] ~~Adicionar endpoint PATCH `/api/candidates/:candidateId/update-contact` no backend.~~
- [x] ~~Frontend exibe coluna "Última Atualização" com formatação adequada.~~
- [x] ~~Adicionar botão de "refresh" para RH atualizar manualmente a data de contato.~~
- [x] ~~Implementar função `handleUpdateLastContact` no frontend.~~
- [ ] **Testando:** Backend calcula e retorna o tempo desde `ultima_atualizacao`.
- [ ] **Testando:** Implementar feedback visual após atualização manual.

## ⏳ Fase 4: Automação e Configurações Avançadas
- [ ] Backend implementa job agendado para inativar candidatos sem atualização.
- [ ] Endpoint para salvar configurações de automação do usuário.
- [ ] Frontend permite configurar automação e período de inativação.
- [ ] Exibir status "Inativo" automaticamente conforme configuração.
- [ ] Página de configurações com seção "Automação do Banco de Talentos".

## ⏳ Fase 5: Segurança e Experiência
- [ ] Garantir acesso restrito aos vídeos (autenticação/autorização).
- [ ] Validar tamanho e formato do vídeo no upload.
- [ ] Feedback de progresso durante upload.
- [ ] Melhorar UX do player de vídeo (modal, controles, etc).
- [ ] Implementar geração de links temporários para acesso seguro.

---

## 📋 Tarefas Baserow Necessárias

### Na Tabela de Candidatos:
1. **Campo `video_entrevista`:**
   - Tipo: URL (para link do vídeo)
   - Nome: `video_entrevista`

2. **Campo `status_video`:**
   - Tipo: Seleção Única
   - Opções: `Pendente`, `Enviado`, `Aprovado`, `Reprovado`

3. **Campo `ultima_atualizacao`:**
   - Tipo: Data/Hora
   - Nome: `ultima_atualizacao`

### Na Tabela de Usuários:
1. **Campo `automacao_inativacao`:**
   - Tipo: Booleano
   - Default: false

2. **Campo `periodo_inativacao_meses`:**
   - Tipo: Número
   - Default: 6

---

## 🚀 Próximos Passos Imediatos

1. **Implementar Upload de Vídeo:**
   - Criar modal de upload de vídeo
   - Endpoint backend para receber arquivo
   - Validação de formato e tamanho

2. **Botão de Atualização Manual:**
   - Adicionar ícone de "refresh" na tabela
   - Endpoint PATCH para atualizar `ultima_atualizacao`
   - Feedback visual após clique

3. **Player de Vídeo Melhorado:**
   - Modal para exibir vídeo em tamanho maior
   - Controles de aprovação/reprovação após assistir

---

## 📝 Notas Técnicas

- **Armazenamento de Vídeo:** Usar serviço externo (AWS S3, Google Cloud Storage) ou campo de arquivo do Baserow
- **Segurança:** Implementar autenticação para acesso aos vídeos
- **Performance:** Considerar compressão e otimização de vídeos
- **UX:** Feedback claro para candidatos sobre status do envio do vídeo

---

## ✅ Status Atual

- ✅ **Tipos TypeScript:** Completos e corrigidos
- ✅ **Interface Visual:** Colunas adicionadas na tabela
- ✅ **Upload de Vídeo:** Modal criado e conectado ao backend
- ✅ **Atualização Manual:** Botão e endpoint implementados
- 🔄 **Backend Endpoints:** Implementados, aguardando teste
- ⏳ **Funcionalidades Avançadas:** Pendente
