---
title: ADR-0004 - Drizzle ORM e persistência PostgreSQL
status: accepted
date: 2026-11-18
---

# ADR-0004 - Drizzle ORM e persistência PostgreSQL

## Contexto

A aplicação precisa persistir usuários, sessões de autenticação e metadados de
documentos no PostgreSQL 18 definido na [`ADR-0002`](0002-docker-development-environment.md).
Até `FEAT-002`, usuários e sessões permaneceram em memória, bloqueando a inicialização
em `NODE_ENV=production` conforme a [`ADR-0001`](0001-google-id-token-and-server-session.md).

Precisamos escolher a camada de acesso a dados, a estratégia de migrations e a forma
de integrar o armazenamento persistente ao `@nestjs/authentication` e aos repositórios
de domínio, mantendo compatibilidade estrita com Node.js 26 LTS, ESM e TypeScript em
modo estrito.

## Restrições e critérios

- Não vazar tipos ou decorators de banco de dados para entidades de domínio ou
  contratos HTTP.
- Manter suporte nativo a ESM e TypeScript estrito sem depender de binários externos
  em tempo de execução.
- Gerar migrations SQL versionadas, determinísticas e auditáveis no repositório.
- Cumprir integralmente o contrato `SessionStore` de `@nestjs/authentication`,
  incluindo escritas condicionais atômicas para `touchSession` e `deleteSession`.
- Garantir isolamento por proprietário (`userId`) nas operações de documentos e
  invariantes do modelo de dados no próprio schema PostgreSQL.
- Permitir que testes unitários e E2E HTTP continuem rápidos com implementações em
  memória, enquanto uma suíte dedicada de integração valida os repositórios e o
  `SessionStore` contra o PostgreSQL real.

## Opções consideradas

### Opção A - Drizzle ORM + `drizzle-kit` + `pg`

- Vantagens: schema declarativo em TypeScript com inferência estrita; zero decorators
  em entidades de domínio; suporte nativo a ESM; migrations em SQL puro geradas por
  `drizzle-kit` e aplicáveis via `drizzle-orm/node-postgres/migrator`; controle fino
  sobre expressões SQL (`ON CONFLICT`, `WHERE` condicional e `RETURNING`).
- Desvantagens: exige mapeamento explícito entre linhas da tabela e objetos de domínio
  nos repositórios.

### Opção B - Driver `pg` puro com SQL manual

- Vantagens: menor número de dependências de produção e controle total sobre SQL.
- Desvantagens: ausência de verificação estática entre schema e queries, maior código
  repetitivo para mapeamento de colunas e necessidade de ferramenta separada para
  gerenciar migrations.

### Opção C - TypeORM (`@nestjs/typeorm`) ou Prisma ORM

- Vantagens: ecossistema amplo e integração conhecida no NestJS.
- Desvantagens: TypeORM acopla entidades a classes com decorators e metadados de
  reflexão; Prisma exige geração de cliente e binários/engines adicionais no build
  multi-stage do Docker.

## Decisão

Adotamos a opção A: **`drizzle-orm`** com o driver **`pg`** (`node-postgres`) em
produção e **`drizzle-kit`** como dependência de desenvolvimento para geração e
inspeção de migrations SQL.

O módulo `DatabaseModule` gerencia o `Pool` do PostgreSQL e a instância do Drizzle,
encerrando conexões em `OnApplicationShutdown`. As migrations ficam versionadas em
`drizzle/` e podem ser aplicadas de forma programática ou via CLI.

Os repositórios (`PostgresUsersRepository`, `PostgresDocumentsRepository`) e o
`PostgresSessionStore` encapsulam todas as consultas Drizzle. O `PostgresSessionStore`
registra-se em `AuthenticationStorage.registerSource({ sessions: this })`,
habilitando execução em produção. Para preservar a velocidade e o determinismo dos
testes unitários e E2E HTTP em `NODE_ENV=test`, os módulos permitem o uso dos
adaptadores em memória quando configurados para testes sem banco, enquanto a suíte
`test:integration` valida todos os adaptadores PostgreSQL e o
`authenticationStoreContract` diretamente contra o serviço `postgres`.

## Consequências

### Positivas

- Entidades de domínio (`User`, `Document`) permanecem interfaces TypeScript puras.
- Invariantes críticas (`google_sub` único, `storage_key` única, `analysis` obrigatória
  quando `status = 'completed'`, chave estrangeira e deleção em cascata de documentos)
  são garantidas tanto na aplicação quanto no PostgreSQL.
- `NODE_ENV=production` passa a contar com armazenamento persistente compartilhado
  para sessões e usuários.
- Testes unitários e E2E HTTP continuam executando em milissegundos sem depender de I/O
  de rede, e os testes de integração comprovam a fidelidade do SQL real.

### Negativas ou trade-offs

- Alterações no schema em `src/database/schema.ts` exigem geração e commit da
  migration SQL correspondente em `drizzle/`.
- Mantemos implementações `InMemory*` e `Postgres*` alinhadas pelo mesmo contrato de
  repositório e verificadas por testes compartilhados.

## Plano de validação

- Validar migrations SQL em banco PostgreSQL limpo.
- Executar `authenticationStoreContract` (`@nestjs/authentication/testing`) com
  `{ contracts: ['sessions'], concurrent: true }` contra `PostgresSessionStore`.
- Testar `PostgresUsersRepository` e `PostgresDocumentsRepository` contra PostgreSQL,
  incluindo isolamento entre dois usuários e violação de invariantes.
- Executar `npm run lint`, `npm test`, `npm run test:integration`, `npm run test:e2e`
  e `npm run build`.

## Substitui ou é substituída por

- Complementa a [`ADR-0001`](0001-google-id-token-and-server-session.md) e a
  [`ADR-0002`](0002-docker-development-environment.md).
