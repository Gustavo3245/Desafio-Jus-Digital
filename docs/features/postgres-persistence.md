---
title: Persistência de usuários, sessões e documentos em PostgreSQL
status: in_progress
last_updated: 2026-11-18
feature_id: FEAT-003
requirements:
  - AUTH-003
  - DOC-002
  - DOC-003
  - DOC-004
  - DOC-005
  - AI-002
  - AI-003
  - STO-002
  - SEC-002
---

# Persistência de usuários, sessões e documentos em PostgreSQL

## Problema

Substituir o armazenamento exclusivamente em memória por persistência relacional em
PostgreSQL para usuários e sessões de autenticação, além de estabelecer o modelo
persistido e o repositório de documentos com isolamento estrito por proprietário,
preparando a base para upload S3 (`FEAT-004`), análise OpenAI (`FEAT-005`) e
operações de leitura e exclusão (`FEAT-006`).

## Escopo

### Incluído

- Validação de `DATABASE_URL` na configuração da aplicação.
- Módulo `DatabaseModule` com pool de conexões PostgreSQL (`pg`), integração com
  Drizzle ORM e encerramento limpo de conexões no shutdown da aplicação.
- Schema relacional e migration SQL inicial para as tabelas `users`, `sessions` e
  `documents`, com constraints de integridade e índices de consulta.
- `PostgresUsersRepository` implementando `UsersRepository` com upsert atômico por
  `googleSub`.
- `PostgresSessionStore` implementando `SessionStore` de `@nestjs/authentication` e
  registrado em `AuthenticationStorage`.
- Modelo de domínio `Document`, contrato `DocumentsRepository` e implementações
  `PostgresDocumentsRepository` e `InMemoryDocumentsRepository` com autorização por
  proprietário (`userId`).
- Suíte de testes unitários e de integração contra PostgreSQL, incluindo o contrato
  oficial `authenticationStoreContract`.

### Não incluído

- Endpoints HTTP de criação, listagem, download ou exclusão de documentos
  (`FEAT-004`, `FEAT-005` e `FEAT-006`).
- Upload ou exclusão de objetos no AWS S3 (`FEAT-004` e `FEAT-006`).
- Integração com a API da OpenAI (`FEAT-005`).

## Atores e autorização

- O módulo de autenticação cria, consulta, atualiza atividade e revoga sessões
  vinculadas a um `userId`.
- Os repositórios de documentos exigem `userId` em todas as consultas, atualizações
  e exclusões de documentos de usuário, impedindo acesso cruzado (IDOR) desde a
  camada de persistência.

## Pré-condições

- Instância PostgreSQL acessível pela variável `DATABASE_URL` (fornecida localmente
  pelo Docker Compose da `FEAT-001`).
- Migrations aplicadas ao banco antes do uso das tabelas.

## Fluxo principal

1. A aplicação valida `DATABASE_URL` na inicialização e configura o `DatabaseModule`.
2. Quando a persistência PostgreSQL está ativa, `PostgresSessionStore` registra-se no
   `AuthenticationStorage` como fonte do contrato `sessions`.
3. No login Google, `UsersRepository.upsertGoogleProfile` cria ou atualiza o registro
   em `users` usando `google_sub` como chave única e retorna a entidade `User`.
4. `SignInService` persiste a sessão em `sessions` com o hash SHA-256 do token como
   `id`, e consultas autenticadas recuperam sessão e usuário de forma consistente.
5. Operações de documentos criam registros em estado `processing`, transicionam para
   `completed` (com `analysis` preenchida) ou `failed` (com `failureCode` opcional),
   listam, buscam e removem registros filtrando sempre por `userId`.

## Regras de negócio

- `DB-RULE-001` - `google_sub` é único na tabela `users`; logins subsequentes do mesmo
  `google_sub` atualizam `name`, `email`, `avatar_url` e `updated_at` sem alterar `id`
  nem `created_at`.
- `DB-RULE-002` - `sessions.id` armazena apenas o hash SHA-256 recebido pelo
  `SessionStore`; o token bruto do cookie nunca é persistido.
- `DB-RULE-003` - `touchSession` atualiza `last_active_at` somente se a sessão ainda
  existir e o novo horário for estritamente posterior ao valor armazenado.
- `DB-RULE-004` - `deleteSession` executa remoção atômica e retorna `true` apenas
  quando a chamada efetivamente removeu a linha.
- `DB-RULE-005` - `documents.storage_key` é único e obrigatório.
- `DB-RULE-006` - Um documento em estado `completed` DEVE possuir `analysis` não nula
  e não vazia; um documento em estado `processing` ou `failed` não pode simular
  conclusão sem análise.
- `DB-RULE-007` - Toda leitura, atualização de estado ou exclusão de documento por um
  usuário DEVE filtrar simultaneamente por `id` do documento e `userId` proprietário.
- `DB-RULE-008` - Em `NODE_ENV=production`, a aplicação utiliza obrigatoriamente os
  adaptadores PostgreSQL para usuários, sessões e documentos.

## Estados e erros

| Situação                                            | Comportamento esperado                           | Código/estado        |
| --------------------------------------------------- | ------------------------------------------------ | -------------------- |
| `DATABASE_URL` ausente ou malformada                | Falhar na validação de ambiente na inicialização | erro de startup      |
| Upsert de usuário com `googleSub` existente         | Atualizar perfil preservando `id` e `createdAt`  | `User` atualizado    |
| `touchSession` com timestamp menor/igual ou ausente | Não recriar sessão nem retroceder `lastActiveAt` | no-op seguro         |
| Documento consultado ou excluído por outro usuário  | Retornar `null` / `false` sem revelar existência | isolamento `SEC-002` |
| Tentativa de concluir documento sem `analysis`      | Rejeitar na aplicação e por constraint `CHECK`   | erro de integridade  |
| Duplicidade de `storageKey` em documentos           | Rejeitar por constraint `UNIQUE`                 | erro de integridade  |

## Contratos afetados

- API: nenhum endpoint novo nesta entrega; mantém [`../contracts/http-api.md`](../contracts/http-api.md).
- Dados: [`../architecture/data-model.md`](../architecture/data-model.md).
- Arquitetura: [`ADR-0004`](../architecture/decisions/0004-drizzle-orm-and-postgres-persistence.md).

## Segurança e privacidade

- `DATABASE_URL` permanece exclusivamente no back-end e fora do controle de versão.
- Queries utilizam parâmetros vinculados pelo Drizzle ORM / `pg`, prevenindo SQL
  injection.
- Logs do banco não são habilitados com valores de parâmetros para evitar vazamento
  de tokens, dados pessoais ou conteúdo de análises.
- Todas as operações de `DocumentsRepository` voltadas a recursos do usuário exigem
  `userId` explícito na assinatura.

## Critérios de aceitação

- [ ] Dada uma configuração sem `DATABASE_URL` válida (fora do fallback controlado de
      teste), quando o ambiente é validado, então a inicialização falha.
- [ ] Dado um banco PostgreSQL limpo, quando as migrations são executadas, então as
      tabelas `users`, `sessions` e `documents` e suas constraints são criadas.
- [ ] Dado um perfil Google novo ou existente, quando `upsertGoogleProfile` é chamado
      no `PostgresUsersRepository`, então o usuário é persistido ou atualizado
      preservando seu `id`.
- [ ] Dado o `PostgresSessionStore`, quando a suíte `authenticationStoreContract`
      (`concurrent: true`) é executada contra o PostgreSQL, então todos os casos do
      contrato `sessions` passam.
- [ ] Dados dois usuários distintos no `PostgresDocumentsRepository`, quando um
      usuário tenta ler, atualizar ou excluir um documento do outro, então a operação
      não afeta o registro alheio e retorna ausente (`null` ou `false`).
- [ ] Dado um documento em `processing`, quando transicionado para `completed` com
      análise ou `failed` com código de falha, então o estado e os carimbos de tempo
      são persistidos corretamente.

## Estratégia de teste

- Unitário: `InMemoryUsersRepository`, `InMemoryDocumentsRepository` e validações de
  schema de configuração e invariantes de domínio.
- Integração: `PostgresUsersRepository`, `PostgresSessionStore` (com
  `authenticationStoreContract`) e `PostgresDocumentsRepository` executados contra o
  PostgreSQL.
- E2E: suíte HTTP de autenticação (`test/auth.e2e-spec.ts`) validando que os fluxos
  da API continuam íntegros.

## Observabilidade

- Erros de conexão ou migration falham de forma explícita sem expor a string completa
  de `DATABASE_URL` com credenciais em mensagens públicas.

## Questões em aberto

- A estratégia de compensação entre upload no S3 e persistência no PostgreSQL será
  detalhada em `FEAT-004`.

## Evidência de implementação

Preencher somente ao mudar o estado para `implemented`.

- Código: pendente.
- Testes: pendente.
- ADRs: [`ADR-0004`](../architecture/decisions/0004-drizzle-orm-and-postgres-persistence.md).
