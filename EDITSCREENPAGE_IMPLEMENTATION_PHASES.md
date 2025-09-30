# 📋 IMPLEMENTAÇÃO EDITSCREENPAGE - FASES ESTRUTURADAS

## 🎯 **OBJETIVO PRINCIPAL**
Tornar a interface de **edição de vagas** 100% idêntica à interface de **criação de vagas**, incluindo TODOS os campos hierárquicos.

## 📊 **ANÁLISE COMPARATIVA**

### ✅ **CRIAÇÃO (NewScreeningChecklistPage)** - COMPLETA
- ✅ Dados Básicos (Idade)
- ✅ Localização & Mobilidade (Cidade/Estado, Distância, CNH)
- ✅ Formação Acadêmica (Escolaridade, **Área de formação**, **Cursos complementares**, **Pós-graduação**)
- ✅ Histórico Profissional (**Tempo total**, **Função específica**, **Setor**, **Porte empresa**, **Liderança**)
- ✅ Habilidades Técnicas (**Tecnologias**, **Idiomas**, **Certificações**, **Registros profissionais**)
- ✅ Extras Opcionais (Soft Skills)

### ❌ **EDIÇÃO (EditScreeningPage)** - INCOMPLETA
- ✅ Dados Básicos (Idade) - OK
- ✅ Localização & Mobilidade (Cidade/Estado, CNH) - OK
- ❌ Formação Acadêmica (Falta: **Área de formação**, **Cursos complementares**, **Pós-graduação**)
- ❌ Histórico Profissional (Falta: **Função específica**, **Setor**, **Porte empresa**, **Liderança**)
- ❌ Habilidades Técnicas (Falta: **Tecnologias**, **Idiomas**, **Certificações**, **Registros profissionais**)
- ❌ Extras Opcionais (Implementação básica sem dinamismo)

---

## 🚀 **FASES DE IMPLEMENTAÇÃO**

### **FASE 1: Preparação** ⚙️
**Comando para o Assistant:**
```
FASE 1: Adicione as seções faltantes em Formação Acadêmica no EditScreeningPage:
- Área de formação (com botões + Adicionar Área e remoção dinâmica)
- Cursos complementares (com botões + Adicionar Curso e remoção dinâmica)  
- Pós-graduação (com seletor de nível e checkbox obrigatório)

Copie EXATAMENTE do NewScreeningChecklistPage as seções correspondentes.
```

### **FASE 2: Experiência Profissional** 💼
**Comando para o Assistant:**
```
FASE 2: Adicione as seções faltantes em Histórico Profissional no EditScreeningPage:
- Tempo em função específica (função/cargo + tempo mínimo)
- Experiência em setor específico (com + Adicionar Setor dinâmico)
- Porte de empresa (checkboxes múltiplas opções)
- Cargos de liderança (tamanho equipe + nível liderança)

Copie EXATAMENTE do NewScreeningChecklistPage as seções correspondentes.
```

### **FASE 3: Habilidades Técnicas** 🔧
**Comando para o Assistant:**
```
FASE 3: Adicione a seção completa de Habilidades Técnicas no EditScreeningPage:
- Tecnologias/Softwares (grid com nome, nível, obrigatório, remoção)
- Idiomas (grid com idioma, nível, obrigatório, remoção)
- Certificações técnicas (nome + obrigatório, remoção)
- Registros profissionais (seletor CRM, OAB, CREA, etc.)

Copie EXATAMENTE do NewScreeningChecklistPage a seção completa.
```

### **FASE 4: Extras e Refinamentos** ✨
**Comando para o Assistant:**
```
FASE 4: Finalize a seção Extras Opcionais no EditScreeningPage:
- Soft Skills com adição/remoção dinâmica
- Ícone ⚠️ e aviso de "peso baixo"
- Validação de carregamento de dados existentes
- Teste de paridade visual completa

Copie EXATAMENTE do NewScreeningChecklistPage a seção Extras.
```

---

## 🔧 **CHECKLIST TÉCNICO**

### **Estados React Necessários** (já implementados)
- ✅ `educationRequirements` com todos os campos
- ✅ `experienceRequirements` com todos os campos  
- ✅ `technicalRequirements` com todos os campos
- ✅ Todos os configs específicos (`areaFormacaoConfig`, `tecnologiasConfig`, etc.)

### **Funções Auxiliares Necessárias** (já implementadas)
- ✅ `addAreaFormacao` / `removeAreaFormacao`
- ✅ `addCursoComplementar` / `removeCursoComplementar`
- ✅ `addTecnologia` / `removeTecnologia`
- ✅ `addIdioma` / `removeIdioma`
- ✅ `addCertificacao` / `removeCertificacao`
- ✅ `addSoftSkill` / `removeSoftSkill`

### **Carregamento de Dados** (implementar)
- ⚠️ Verificar se todos os campos são carregados corretamente do `requisitos_json`
- ⚠️ Garantir que arrays dinâmicos sejam populados
- ⚠️ Validar estados dos checkboxes

---

## 🎨 **CRITÉRIOS DE SUCESSO**

### **Visual**
- [ ] Interface idêntica pixel por pixel
- [ ] Mesmas cores e estilos de cada seção
- [ ] Mesmos ícones e layouts
- [ ] Mesma funcionalidade de adicionar/remover

### **Funcional**
- [ ] Todos os campos editáveis
- [ ] Dados existentes carregados corretamente
- [ ] Salvamento funcionando com nova estrutura
- [ ] Webhook enviando dados completos

### **UX**
- [ ] Usuário pode adicionar campos esquecidos
- [ ] Experiência idêntica entre criar/editar
- [ ] Validações apropriadas
- [ ] Feedback visual adequado

---

## 📝 **NOTAS IMPORTANTES**

1. **Manter estrutura existente**: Não quebrar funcionalidades já implementadas
2. **Copiar exatamente**: Usar NewScreeningChecklistPage como fonte única da verdade
3. **Testar incrementalmente**: Após cada fase, verificar se tudo funciona
4. **Validar dados**: Garantir que dados existentes são carregados corretamente
5. **Responsividade**: Manter layout responsivo em todas as adições

---

## 🚨 **POSSÍVEIS PROBLEMAS**

- **Imports faltantes**: Verificar se todos os ícones estão importados
- **Estados não sincronizados**: Garantir que useEffect carrega todos os campos
- **Performance**: Arrays dinâmicos podem impactar performance
- **Validação**: Campos opcionais vs obrigatórios podem causar confusão

---

## ✅ **CRITÉRIO DE FINALIZAÇÃO**

✅ **SUCESSO COMPLETO**: Quando um usuário não conseguir distinguir visualmente entre a tela de criação e edição, exceto pelo título e botão "Salvar Alterações" vs "Criar Triagem".