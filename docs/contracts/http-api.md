---
title: Contrato HTTP
status: draft
last_updated: 2026-11-16
---

# Contrato HTTP

Base sugerida: `/api/v1`. O contrato final deve ser publicado por OpenAPI, mas este
documento registra semântica, autorização e decisões que não devem depender apenas
de decorators.

## Convenções

- JSON em `camelCase`.
- Datas no formato ISO 8601 em UTC.
- IDs opacos; clientes não inferem significado pelo valor.
- Erros possuem `code`, `message` e, quando aplicável, `details` seguros.
- Endpoints de documentos exigem usuário autenticado.

## Endpoints propostos

| Método   | Caminho                    | Finalidade                        |
| -------- | -------------------------- | --------------------------------- |
| `POST`   | `/auth/google`             | Validar Google e criar sessão     |
| `GET`    | `/auth/me`                 | Obter usuário autenticado         |
| `POST`   | `/auth/logout`             | Encerrar sessão                   |
| `POST`   | `/documents`               | Criar documento e iniciar análise |
| `GET`    | `/documents`               | Listar documentos do usuário      |
| `GET`    | `/documents/{id}`          | Ler metadados e análise           |
| `GET`    | `/documents/{id}/download` | Obter download autorizado         |
| `DELETE` | `/documents/{id}`          | Excluir documento próprio         |

## Criação de documento

- Content-Type: `multipart/form-data`.
- Campos: `file`, `title`, `instruction`.
- Resposta e status HTTP dependem da decisão sobre processamento síncrono ou assíncrono.
- O cliente nunca envia `userId`, `storageKey`, estado ou resultado da análise.

## Códigos de erro iniciais

| Código                         | Significado                                         |
| ------------------------------ | --------------------------------------------------- |
| `AUTH_REQUIRED`                | Sessão ausente ou inválida                          |
| `DOCUMENT_NOT_FOUND`           | Documento inexistente ou não acessível pelo usuário |
| `INVALID_FILE`                 | Tipo, tamanho ou conteúdo rejeitado                 |
| `ANALYSIS_FAILED`              | Falha controlada ao processar a análise             |
| `EXTERNAL_SERVICE_UNAVAILABLE` | Integração temporariamente indisponível             |

Use a mesma resposta para documento inexistente e documento de outro usuário, para
não confirmar a existência de recursos alheios.

## Questões em aberto

- Cookies, cabeçalhos e proteção CSRF da sessão.
- Limites e formato de paginação.
- Status HTTP para análise assíncrona.
- Geração de URL pré-assinada ou streaming pelo back-end.
