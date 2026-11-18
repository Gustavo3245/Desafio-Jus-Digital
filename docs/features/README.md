---
title: Índice de funcionalidades
status: accepted
last_updated: 2026-11-18
---

# Funcionalidades

Cada funcionalidade relevante possui uma especificação em
`docs/features/<nome-da-funcionalidade>.md`, criada a partir de
[`docs/templates/feature-spec.md`](../templates/feature-spec.md).

## Ordem inicial sugerida

| ID                                              | Funcionalidade                        | Estado       |
| ----------------------------------------------- | ------------------------------------- | ------------ |
| [`FEAT-001`](docker-development-environment.md) | Ambiente Docker                       | Implementada |
| [`FEAT-002`](google-authentication.md)          | Autenticação Google                   | Implementada |
| `FEAT-003`                                      | Persistência de usuários e documentos | Não iniciada |
| `FEAT-004`                                      | Upload e armazenamento S3             | Não iniciada |
| `FEAT-005`                                      | Análise com OpenAI                    | Não iniciada |
| `FEAT-006`                                      | Listagem, leitura e exclusão          | Não iniciada |

Crie a spec imediatamente antes de trabalhar na funcionalidade, evitando detalhar
todo o sistema com suposições que ainda não foram validadas.
