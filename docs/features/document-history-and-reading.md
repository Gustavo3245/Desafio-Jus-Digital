---
title: Histórico e leitura de documentos do usuário
status: in_progress
last_updated: 2026-11-19
feature_id: FEAT-006
requirements:
  - DOC-002
  - DOC-003
  - SEC-002
---

# Histórico e leitura de documentos do usuário

## Problema

Permitir que uma pessoa autenticada recupere seus documentos, perguntas e análises
persistidos mesmo depois de encerrar a sessão e entrar novamente, sem revelar dados
ou a existência de documentos pertencentes a outra pessoa.

## Escopo

### Incluído

- `GET /api/v1/documents` para listar o histórico do usuário autenticado, do mais
  recente para o mais antigo.
- `GET /api/v1/documents/{id}` para abrir metadados, pergunta e análise de um documento
  pertencente ao usuário autenticado.
- Reutilização do mesmo contrato público de documento, sem `userId` ou `storageKey`.
- Teste da continuidade do histórico depois de logout e novo login Google.
- Exibição do histórico na página manual de validação.

### Não incluído

- Download do arquivo original.
- Exclusão do documento e compensação entre PostgreSQL e S3.
- Paginação, busca ou filtros; serão adicionados quando o volume justificar.

## Atores e autorização

- Somente uma pessoa com sessão válida acessa os endpoints.
- O `userId` vem exclusivamente da sessão e é aplicado em todas as consultas.
- Documento inexistente e documento de outro usuário produzem a mesma resposta.

## Pré-condições

- Usuário e documento persistidos no PostgreSQL.
- Documento associado ao `userId` interno derivado do `sub` Google.

## Fluxo principal

1. O usuário entra com Google e recebe uma sessão da aplicação.
2. O cliente solicita `GET /documents`.
3. A API consulta documentos usando o `userId` autenticado e retorna o histórico.
4. O cliente pode solicitar `GET /documents/{id}` para abrir a pergunta e a análise.
5. Depois de logout e novo login da mesma conta Google, o mesmo `userId` é recuperado
   e o histórico permanece disponível.

## Regras de negócio

- `HISTORY-RULE-001` - A listagem filtra obrigatoriamente por proprietário.
- `HISTORY-RULE-002` - A leitura consulta simultaneamente `id` e `userId`.
- `HISTORY-RULE-003` - A listagem é ordenada por `createdAt` decrescente.
- `HISTORY-RULE-004` - `storageKey` e `userId` nunca aparecem na resposta HTTP.
- `HISTORY-RULE-005` - Logout revoga somente a sessão, não documentos ou análises.

## Estados e erros

| Situação                             | Comportamento esperado      | Código/estado            |
| ------------------------------------ | --------------------------- | ------------------------ |
| Sessão ausente ou inválida           | Rejeitar consulta           | `401 AUTH_REQUIRED`      |
| Usuário sem documentos               | Retornar coleção vazia      | `200` / `documents`      |
| Documento próprio existente          | Retornar pergunta e análise | `200` / `document`       |
| Documento inexistente ou de terceiro | Não confirmar existência    | `404 DOCUMENT_NOT_FOUND` |

## Contratos afetados

- API: [`../contracts/http-api.md`](../contracts/http-api.md).
- Dados: [`../architecture/data-model.md`](../architecture/data-model.md), sem nova
  migration.
- Integrações: nenhuma chamada ao S3 ou à OpenAI durante listagem ou leitura.

## Segurança e privacidade

- Nunca aceitar `userId` do cliente.
- Testar dois usuários distintos nos limites HTTP e de repositório.
- Não registrar perguntas, análises ou nomes de arquivo durante consultas.

## Critérios de aceitação

- [ ] Dado um usuário com documentos, quando solicita a listagem, então recebe somente
      seus documentos em ordem decrescente, sem `storageKey` ou `userId`.
- [ ] Dado um documento próprio, quando solicita por ID, então recebe pergunta e
      análise persistidas.
- [ ] Dado logout seguido de novo login da mesma conta, quando solicita a listagem,
      então o histórico anterior continua disponível.
- [ ] Dado outro usuário, quando tenta listar ou abrir, então não recebe documentos do
      proprietário nem confirma sua existência.

## Estratégia de teste

- Unitário: serviço lista e encontra por proprietário; ausência retorna erro seguro.
- Integração: PostgreSQL preserva o documento depois da revogação e recriação da
  sessão.
- E2E: listagem, leitura, isolamento entre usuários e logout/login.

## Observabilidade

- As consultas não registram conteúdo; erros usam apenas categoria e correlação.

## Questões em aberto

- Definir paginação por cursor antes de volumes altos de documentos.

## Evidência de implementação

Preencher somente ao mudar o estado para `implemented`.
