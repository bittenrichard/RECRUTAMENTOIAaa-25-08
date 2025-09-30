# NOVA ESTRUTURA DO WEBHOOK - TRIAGEM DE CANDIDATOS

## 📋 Estrutura Completa dos Dados Enviados

Quando um candidato é enviado para triagem, o webhook recebe os seguintes dados:

```json
{
  "tipo": "triagem_curriculo_lote",
  "recrutador": {
    "id": 2,
    "nome": "Richard",
    "email": "stl@gmail.com",
    "empresa": "STL - FFT"
  },
  "vaga": {
    "id": 28,
    "titulo": "Desenvolvedor Full Stack",
    "descricao": "Vaga para desenvolvedor com experiência em React e Node.js",
    "endereco": "São Paulo - SP",
    "modo_trabalho": "hibrido",
    "requisitos_estruturados": {
      // DADOS BÁSICOS
      "idade": {
        "min": "25",
        "max": "40"
      },
      
      // LOCALIZAÇÃO & MOBILIDADE
      "cidade_estado": {
        "cidade": "São Paulo",
        "estado": "SP",
        "regioes": ["Centro", "Zona Sul"]
      },
      "distancia": {
        "maxima": "20",
        "calculo_automatico": true
      },
      "cnh": ["B", "A"],
      
      // FORMAÇÃO ACADÊMICA
      "escolaridade_minima": "superior_completo",
      "area_formacao": ["Ciências da Computação", "Sistemas de Informação"],
      "cursos_complementares": ["React", "Node.js", "TypeScript"],
      "pos_graduacao": {
        "nivel": "especializacao",
        "obrigatorio": false
      },
      
      // HISTÓRICO PROFISSIONAL
      "tempo_total_experiencia": {
        "minimo": "3",
        "preferencial": "5"
      },
      "tempo_funcao_especifica": {
        "funcao": "Desenvolvedor Full Stack",
        "tempo_minimo": "2"
      },
      "experiencia_setor": ["Tecnologia", "Startups"],
      "porte_empresa": ["medio", "grande"],
      "cargos_lideranca": {
        "tamanho_equipe": "5",
        "nivel": "coordenacao"
      },
      
      // HABILIDADES TÉCNICAS
      "tecnologias_softwares": [
        {
          "nome": "React",
          "nivel": "avancado",
          "obrigatorio": true
        },
        {
          "nome": "Node.js",
          "nivel": "intermediario",
          "obrigatorio": true
        }
      ],
      "idiomas": [
        {
          "idioma": "Inglês",
          "nivel": "intermediario",
          "obrigatorio": false
        }
      ],
      "certificacoes_tecnicas": [
        {
          "nome": "AWS Certified",
          "obrigatorio": false
        }
      ],
      "registros_profissionais": ["CREA", "CRC"],
      
      // SOFT SKILLS
      "soft_skills": ["Comunicação", "Liderança", "Trabalho em equipe"]
    },
    "requisitos_obrigatorios": "Experiência com React e Node.js",
    "requisitos_desejaveis": "Conhecimento em AWS"
  },
  "candidatos": [
    {
      "id": 203,
      "nome": "CURRICULO TANISE CASTRO",
      "email": "tanise@email.com",
      "telefone": null,
      "curriculo_url": "https://dados.focoserv.com.br/media/user_files/...",
      "status": "Triagem",
      "arquivo": {
        "nome": "CURRICULO TANISE CASTRO.pdf",
        "tipo": "application/pdf",
        "tamanho": 143544,
        "base64": "JVBERi0xLjQKMSAwIG9iajw8L..."
      }
    }
  ]
}
```

## 🎯 Campos Importantes para a IA

### 📊 CAMPOS SEMPRE PRESENTES:
- `vaga.id` - ID único da vaga
- `vaga.titulo` - Título da vaga
- `vaga.requisitos_estruturados` - **NOVO**: Estrutura hierárquica completa

### 🔍 CAMPOS QUE PODEM SER NULL:
Todos os campos dentro de `requisitos_estruturados` podem ser `null` se não foram preenchidos:

- `idade`: null (se não foi definido limite de idade)
- `cidade_estado`: null (se não foi especificada localização)
- `escolaridade_minima`: null (se não foi exigida escolaridade específica)
- `tecnologias_softwares`: null (se não foram especificadas tecnologias)
- etc.

## 🤖 Benefícios para a IA

1. **PRECISÃO**: A IA sabe exatamente quais campos analisar
2. **EFICIÊNCIA**: Não perde tempo analisando critérios não exigidos
3. **FLEXIBILIDADE**: Pode dar pesos diferentes para cada categoria
4. **COMPATIBILIDADE**: Mantém campos legados para transição suave

## ⚡ Exemplo de Campo NULL

Se uma vaga não exige idiomas, o campo será:
```json
{
  "idiomas": null
}
```

A IA deve **ignorar** este critério na pontuação do candidato.

## 🔄 Compatibilidade

Os campos legados ainda estão presentes:
- `vaga.requisitos_obrigatorios`
- `vaga.requisitos_desejaveis`

Mas a IA deve **priorizar** os dados estruturados em `vaga.requisitos_estruturados`.