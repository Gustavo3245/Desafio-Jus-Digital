# JusDigital

Sistema web de gestão e análise de documentos com Google OAuth, AWS e OpenAI,
desenvolvido como desafio técnico FullStack.

## Estado atual

O back-end NestJS está na raiz do repositório. A autenticação Google está
implementada com validação do ID token no servidor e sessão opaca em cookie. Usuários
e sessões permanecem em memória até a implementação da persistência PostgreSQL.

## Requisitos

- Node.js 26 LTS
- npm 11+

## Executar localmente

```bash
npm install
cp .env.example .env
npm run start:dev
```

Preencha `GOOGLE_CLIENT_ID` com o Client ID Web configurado no Google Cloud e ajuste
`FRONTEND_URL` para a origem exata do front-end. A API fica disponível por padrão em
`http://localhost:3000/api/v1`.

## Autenticação

- `POST /api/v1/auth/google` recebe `{ "credential": "<google-id-token>" }`.
- `GET /api/v1/auth/me` retorna o perfil da sessão.
- `POST /api/v1/auth/logout` revoga a sessão atual.

Clientes web devem enviar cookies com `credentials: 'include'`.

## Verificação

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

## Documentação

Comece por [`docs/README.md`](docs/README.md). O projeto adota desenvolvimento
orientado à documentação para manter requisitos, contratos, código e testes
alinhados.
