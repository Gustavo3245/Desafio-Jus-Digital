---
title: Desenvolvimento com agentes e skills
status: accepted
last_updated: 2026-11-16
---

# Desenvolvimento com agentes e skills

## Separação de responsabilidades

- `AGENTS.md`: regras curtas que valem em toda tarefa.
- `docs/`: contexto, requisitos, contratos e decisões persistentes.
- `.agents/skills/`: procedimentos repetíveis carregados somente quando necessários.
- Linters e testes: enforcement mecânico; não substitua por instruções textuais.

## Skills iniciais recomendadas

### `feature-spec`

Use para criar, entrevistar, revisar ou completar uma especificação antes de
codificar. A saída é um arquivo em `docs/features/`, sem inventar decisões.

```yaml
description: Cria e revisa feature specs do JusDigital antes da implementação. Use ao planejar uma funcionalidade, esclarecer requisitos ou definir critérios de aceitação; não use para implementar código.
```

### `nestjs-feature`

Use para implementar no NestJS uma feature spec suficientemente definida. A saída
inclui o menor conjunto de código, testes e documentação que satisfaça os critérios.

```yaml
description: Implementa incrementos NestJS a partir de uma feature spec aceita do JusDigital, mantendo contratos, testes e documentação alinhados. Use para construir ou alterar funcionalidades do back-end; não use quando os requisitos ainda estiverem indefinidos.
```

### `project-review`

Use antes de commit, PR ou entrega. A saída padrão é uma lista priorizada de achados;
correções só são implementadas quando solicitadas.

```yaml
description: Revisa mudanças do JusDigital contra requisitos, contratos, segurança e testes. Use antes de commit, PR ou entrega; por padrão relata achados e não implementa correções.
```

Comece com essas três. Crie outra skill somente quando um procedimento se repetir ou
exigir orientação especializada que não pertença ao `AGENTS.md`.

## Como integrar uma skill

1. Invoque `$skill-creator` e informe que a skill será local ao repositório.
2. Crie `.agents/skills/<skill-name>/SKILL.md`.
3. Mantenha o procedimento essencial em `SKILL.md`.
4. Coloque exemplos ou regras extensas em `references/` somente quando necessários.
5. Adicione scripts apenas para verificações determinísticas e repetidas.
6. Valide com o `quick_validate.py` fornecido pelo `skill-creator`.
7. Teste com um caso real e refine a partir de falhas observadas.

Estrutura mínima:

```text
.agents/skills/feature-spec/
└── SKILL.md
```

Estrutura com material progressivo:

```text
.agents/skills/project-review/
├── SKILL.md
└── references/
    └── review-checklist.md
```

As skills podem ser invocadas explicitamente com `$nome-da-skill` ou selecionadas
implicitamente quando a descrição corresponder à tarefa.

## Plugins e ferramentas úteis

- **OpenAI Developers:** documentação e implementação da OpenAI API.
- **Codex Security:** revisão de segurança mais profunda.
- **GitHub:** PRs, issues e CI quando o repositório remoto estiver ativo.
- **Figma:** leitura do protótipo e validação do front-end.

Adicione plugins ou MCPs somente quando removerem um fluxo manual real. Eles fornecem
acesso a sistemas externos; as skills continuam definindo o método de trabalho.
