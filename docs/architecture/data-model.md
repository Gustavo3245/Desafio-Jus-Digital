---
title: Modelo de dados
status: accepted
last_updated: 2026-11-18
---

# Modelo de dados

A persistência relacional em PostgreSQL segue as decisões da
[`ADR-0004`](decisions/0004-drizzle-orm-and-postgres-persistence.md).

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

## Session

| Campo          | Regra                                                       |
| -------------- | ----------------------------------------------------------- |
| `id`           | Hash SHA-256 do token opaco; o token bruto não é salvo      |
| `userId`       | Identificador do usuário proprietário da sessão (indexado)  |
| `createdAt`    | Data de criação da sessão                                   |
| `expiresAt`    | Expiração absoluta; nunca estendida por atividade           |
| `lastActiveAt` | Última atividade registrada para timeout de inatividade     |
| `mfa`          | Estado opcional de MFA do contrato `@nestjs/authentication` |
| `metadata`     | Metadados opcionais da sessão em JSON                       |

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

- Um usuário possui zero ou muitas sessões e zero ou muitos documentos.
- A exclusão de um usuário remove seus documentos em cascata no banco; sessões são
  gerenciadas pelo contrato `SessionStore` (`deleteUserSessions`).
- `googleSub` é único.
- `storageKey` é única e não deriva somente do nome original.
- `analysis` é obrigatória quando `status = completed`.
- Respostas da API nunca expõem `storageKey` diretamente.
- Consultas combinam documento e proprietário ou aplicam autorização equivalente.

## Exclusão

A exclusão precisa definir consistência entre banco e S3. Até uma ADR decidir a
estratégia, o sistema não deve assumir que apagar apenas o registro ou apenas o
objeto é suficiente.
