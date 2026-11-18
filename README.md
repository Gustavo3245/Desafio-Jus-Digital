# JusDigital

Sistema web de gestão e análise de documentos com Google OAuth, AWS e OpenAI,
desenvolvido como desafio técnico FullStack.

## Estado atual

O back-end NestJS está na raiz do repositório. A autenticação Google está
implementada com validação do ID token no servidor e sessão opaca em cookie. A
persistência em PostgreSQL (`users`, `sessions` e `documents`) está implementada com
Drizzle ORM e migrations SQL versionadas, mantendo adaptadores em memória para a
execução rápida de testes unitários e E2E HTTP. O ambiente Docker fornece a API e
PostgreSQL para desenvolvimento e testes.

## Requisitos

- Node.js 26 LTS
- npm 11+

Ou, para o ambiente containerizado:

- Docker Engine
- Docker Compose v2

## Executar localmente

```bash
npm install
cp .env.example .env
npm run start:dev
```

Preencha `GOOGLE_CLIENT_ID` com o Client ID Web configurado no Google Cloud e ajuste
`FRONTEND_URL` para a origem exata do front-end. A API fica disponível por padrão em
`http://localhost:3000/api/v1`.

## Ambiente Docker

Crie a configuração local e suba os dois serviços:

```bash
cp .env.example .env
npm run docker:up
npm run docker:ps
```

- API: `http://localhost:3000/api/v1`.
- PostgreSQL no host: `localhost:5433`.
- PostgreSQL entre containers: `postgres:5432`.
- Banco, usuário e senha locais: `jusdigital`.

O código-fonte é montado no container e o NestJS executa com hot reload. Depois de
alterar dependências, sincronize o volume de `node_modules` com a API parada:

```bash
docker compose stop api
npm run docker:install
docker compose up --detach --wait api
```

Comandos operacionais:

```bash
npm run docker:logs
npm run docker:test
npm run docker:down
```

`docker:down` preserva os volumes. Para apagar deliberadamente todos os dados locais,
use `docker compose down --volumes`; essa ação não pode ser desfeita.

Para gerar ou aplicar migrations SQL do Drizzle no PostgreSQL local:

```bash
npm run db:generate
npm run db:migrate
```

## Autenticação

- `POST /api/v1/auth/google` recebe `{ "credential": "<google-id-token>" }`.
- `POST /api/v1/auth/google/callback` recebe o formulário do Google Sign-In em modo
  redirect, cria a sessão e retorna para `${FRONTEND_URL}/auth/callback`.
- `GET /api/v1/auth/me` retorna o perfil da sessão.
- `POST /api/v1/auth/logout` revoga a sessão atual.

Clientes web devem enviar cookies com `credentials: 'include'`.

No cliente OAuth Web do Google Cloud, configure:

- origem JavaScript autorizada: `http://localhost:5173`;
- URI de redirecionamento autorizada:
  `http://localhost:3000/api/v1/auth/google/callback`.

O valor da URI precisa ser idêntico, incluindo esquema, porta e caminho. Para testar
métodos de verificação da Conta Google, use um navegador normal; navegadores
incorporados podem não oferecer passkeys, chaves de segurança ou confirmação por
dispositivo.

## Verificação

```bash
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run build
```

Os mesmos comandos podem ser executados no container com
`docker compose exec api <comando>` enquanto o ambiente estiver ativo.

## Documentação

Comece por [`docs/README.md`](docs/README.md). O projeto adota desenvolvimento
orientado à documentação para manter requisitos, contratos, código e testes
alinhados.
