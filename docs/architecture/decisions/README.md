---
title: Registro de decisões arquiteturais
status: accepted
last_updated: 2026-11-16
---

# Decisões arquiteturais

Use ADR para escolhas duradouras, difíceis de reverter ou que afetem mais de um
módulo. Não crie ADR para detalhes locais facilmente alteráveis.

## Processo

1. Copie `docs/templates/adr.md`.
2. Use o próximo número sequencial e um nome em `kebab-case`.
3. Descreva contexto, opções, decisão e consequências.
4. Use `proposed` antes da aprovação e `accepted` após a decisão.
5. Nunca reescreva uma decisão histórica aceita; crie outra ADR que a substitua.

## Índice

| ADR | Estado | Decisão                          |
| --- | ------ | -------------------------------- |
| -   | -      | Nenhuma decisão registrada ainda |

## Primeiras ADRs candidatas

- ORM e migrations.
- Estratégia de sessão após Google OAuth.
- Pipeline e compensação de upload/análise.
- Exclusão consistente no banco e S3.
