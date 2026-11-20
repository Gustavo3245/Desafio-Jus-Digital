---
title: Índice de funcionalidades
status: accepted
last_updated: 2026-11-20
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
| [`FEAT-003`](postgres-persistence.md)           | Persistência de usuários e documentos | Implementada |
| [`FEAT-004`](document-upload-and-s3-storage.md) | Upload e armazenamento S3             | Implementada |
| [`FEAT-005`](openai-document-analysis.md)       | Análise com OpenAI                    | Implementada |
| [`FEAT-006`](document-history-and-reading.md)   | Histórico, listagem e leitura         | Implementada |
| [`FEAT-007`](document-deletion.md)              | Exclusão de documentos                | Implementada |
| [`FEAT-008`](frontend-authentication.md)        | Front-end de autenticação e conta     | Implementada |
| [`FEAT-009`](frontend-documents-home.md)        | Front-end inicial de documentos       | Implementada |

Crie a spec imediatamente antes de trabalhar na funcionalidade, evitando detalhar
todo o sistema com suposições que ainda não foram validadas.
