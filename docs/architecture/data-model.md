---
title: Modelo de dados
status: draft
last_updated: 2026-11-16
---

# Modelo de dados

## User

| Campo       | Regra                                   |
| ----------- | --------------------------------------- |
| `id`        | Identificador interno imutável          |
| `googleSub` | Identificador estável e único do Google |
| `name`      | Nome atual do perfil                    |
| `email`     | E-mail atual do perfil                  |
| `avatarUrl` | Foto de perfil opcional                 |
| `createdAt` | Data de criação                         |
| `updatedAt` | Data da última atualização              |

## Document

| Campo          | Regra                                            |
| -------------- | ------------------------------------------------ |
| `id`           | Identificador interno imutável                   |
| `userId`       | Proprietário; chave estrangeira para `User`      |
| `title`        | Título informado pelo usuário                    |
| `instruction`  | Instrução enviada à IA                           |
| `originalName` | Nome original apenas para exibição               |
| `storageKey`   | Chave privada e única do objeto no S3            |
| `mimeType`     | Tipo validado do arquivo                         |
| `sizeBytes`    | Tamanho validado                                 |
| `status`       | `processing`, `completed` ou `failed`            |
| `analysis`     | Resposta da IA, ausente enquanto não concluída   |
| `failureCode`  | Código interno controlado para falhas conhecidas |
| `createdAt`    | Data de criação                                  |
| `updatedAt`    | Data da última atualização                       |

## Relações e invariantes

- Um usuário possui zero ou muitos documentos.
- `googleSub` é único.
- `storageKey` é única e não deriva somente do nome original.
- `analysis` é obrigatória quando `status = completed`.
- Respostas da API nunca expõem `storageKey` diretamente.
- Consultas combinam documento e proprietário ou aplicam autorização equivalente.

## Exclusão

A exclusão precisa definir consistência entre banco e S3. Até uma ADR decidir a
estratégia, o sistema não deve assumir que apagar apenas o registro ou apenas o
objeto é suficiente.
