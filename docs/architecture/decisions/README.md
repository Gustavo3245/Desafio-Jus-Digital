---
title: Registro de decisões arquiteturais
status: accepted
last_updated: 2026-11-18
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

| ADR                                                        | Estado | Decisão                                                 |
| ---------------------------------------------------------- | ------ | ------------------------------------------------------- |
| [`ADR-0001`](0001-google-id-token-and-server-session.md)   | Aceita | Google ID token e sessão própria no servidor            |
| [`ADR-0002`](0002-docker-development-environment.md)       | Aceita | Ambiente Docker para API e PostgreSQL                   |
| [`ADR-0003`](0003-google-sign-in-redirect.md)              | Aceita | Google Sign-In na mesma aba                             |
| [`ADR-0004`](0004-drizzle-orm-and-postgres-persistence.md) | Aceita | Drizzle ORM e persistência PostgreSQL                   |
| [`ADR-0005`](0005-s3-storage-and-upload-compensation.md)   | Aceita | Armazenamento privado no AWS S3 e compensação no upload |
| [`ADR-0006`](0006-synchronous-openai-document-analysis.md) | Aceita | Análise síncrona com OpenAI Responses API               |

## Primeiras ADRs candidatas

- Exclusão consistente no banco e S3.
