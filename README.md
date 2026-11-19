# JusDigital

Sistema web de gestão e análise de documentos com Google OAuth, AWS e OpenAI,
desenvolvido como desafio técnico FullStack.

## Estado atual

O back-end NestJS está na raiz do repositório. A autenticação Google está
implementada com validação do ID token no servidor e sessão opaca em cookie. A
persistência em PostgreSQL (`users`, `sessions` e `documents`) está implementada com
Drizzle ORM e migrations SQL versionadas. O upload de documentos (`POST /api/v1/documents`)
valida tamanho e assinatura binária (`.pdf`, `.docx`, `.doc`, `.txt`), armazena o
arquivo original de forma privada no AWS S3 e registra os metadados no PostgreSQL com
compensação automática. O mesmo fluxo envia o documento e a instrução à OpenAI,
persiste uma resposta textual válida e registra falhas sem marcar o documento como
concluído. O ambiente Docker fornece a API e PostgreSQL para desenvolvimento e testes.

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
`FRONTEND_URL` para a origem exata do front-end. Preencha `OPENAI_API_KEY` com uma
chave ativa mantida somente no `.env`; não reutilize nem registre credenciais expostas.
A API fica disponível por padrão em `http://localhost:3000/api/v1`.

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

## Upload e AWS S3

- `POST /api/v1/documents` recebe `multipart/form-data` com `file`, `title` e
  `instruction`.
- Formatos aceitos: `.pdf`, `.docx`, `.doc` e `.txt` (até 10 MB, validados por
  extensão e assinatura mágica / conteúdo binário).
- Configure no `.env` as variáveis `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`
  e `AWS_SECRET_ACCESS_KEY` de um usuário IAM com acesso restrito exclusivamente às
  operações `s3:PutObject`, `s3:GetObject` e `s3:DeleteObject` no bucket privado.
- `AWS_S3_BUCKET` recebe somente o nome simples do bucket, por exemplo
  `jusdigital-documents-dev-3245`; não use ARN (`arn:aws:s3:::`) nem URL `s3://`.

Se o upload responder `Document storage service is temporarily unavailable`, consulte
os logs seguros da API. Eles informam operação, categoria, status HTTP e request ID do
S3 sem registrar bucket, chave do objeto, credenciais ou documento:

```bash
docker compose logs --tail 100 api
```

## Análise com OpenAI

- O upload envia arquivo e instrução à Responses API e só retorna `completed` depois
  de persistir uma resposta textual válida.
- Configure `OPENAI_API_KEY` apenas no back-end. `OPENAI_MODEL` usa `gpt-4o-mini` por
  padrão e permite migração controlada de modelo.
- Timeout, rate limit ou indisponibilidade retornam `503`; resposta vazia retorna
  `502`. Em ambos os casos, o registro permanece `failed`.
- `GET /api/v1/documents` recupera o histórico da conta autenticada e
  `GET /api/v1/documents/{id}` abre pergunta e análise. Logout encerra apenas a sessão;
  o histórico permanece associado ao mesmo usuário Google.

### Teste manual sem AWS

O ambiente Docker usa `DOCUMENT_STORAGE_DRIVER=memory` por padrão em desenvolvimento,
permitindo validar Google Auth, upload e uma chamada real à OpenAI antes da
configuração do bucket. O driver em memória é rejeitado em produção.

Com a API ativa em `http://localhost:3000`, inicie a página local:

```bash
npm run start:manual
```

Abra `http://localhost:5173`, entre com o Google, selecione um documento e envie a
pergunta. A página exibe somente o resultado retornado pela API; a chave da OpenAI
continua restrita ao back-end.

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
