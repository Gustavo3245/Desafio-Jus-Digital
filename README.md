# JusDigital

[![CI](https://github.com/Gustavo3245/Desafio-Jus-Digital/actions/workflows/ci.yml/badge.svg)](https://github.com/Gustavo3245/Desafio-Jus-Digital/actions/workflows/ci.yml)
[![CD](https://github.com/Gustavo3245/Desafio-Jus-Digital/actions/workflows/cd.yml/badge.svg)](https://github.com/Gustavo3245/Desafio-Jus-Digital/actions/workflows/cd.yml)
![Node.js](https://img.shields.io/badge/Node.js-26_LTS-339933?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Aplicação web FullStack para gestão e análise inteligente de documentos jurídicos e corporativos. Permite que usuários autenticados via **Google OAuth** enviem documentos (`.pdf`, `.docx`, `.doc`, `.txt`), armazenem os arquivos originais de forma privada no **AWS S3**, processem instruções personalizadas com **OpenAI (`gpt-4o-mini`)** e consultem ou gerenciem seu histórico persistido em **PostgreSQL**.

---

## Sumário

- [Principais Funcionalidades](#principais-funcionalidades)
- [Arquitetura e Stack Tecnológica](#arquitetura-e-stack-tecnológica)
- [Estrutura do Repositório](#estrutura-do-repositório)
- [Começando (Quick Start)](#começando-quick-start)
  - [Pré-requisitos](#pré-requisitos)
  - [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
  - [Execução com Docker Compose (Recomendado)](#execução-com-docker-compose-recomendado)
  - [Execução Local (Node.js)](#execução-local-nodejs)
  - [Migrations do Banco de Dados](#migrations-do-banco-de-dados)
- [Configuração das Integrações](#configuração-das-integrações)
  - [Google OAuth 2.0](#google-oauth-20)
  - [AWS S3 (Armazenamento Privado)](#aws-s3-armazenamento-privado)
  - [OpenAI Responses API](#openai-responses-api)
  - [Modo de Desenvolvimento sem AWS](#modo-de-desenvolvimento-sem-aws)
- [Resumo da API HTTP](#resumo-da-api-http)
- [Testes, Qualidade e CI/CD](#testes-qualidade-e-cicd)
- [Documentação Técnica e ADRs](#documentação-técnica-e-adrs)

---

## Principais Funcionalidades

- **Autenticação Google OAuth & Sessão Segura**: validação de Google ID Token no servidor (suportando fluxos popup e redirect com proteção CSRF dupla) e emissão de sessão opaca em cookie `HttpOnly` persistida no PostgreSQL.
- **Upload Validado e Armazenamento Privado**: inspeção de tamanho (até 10 MB), extensão e assinatura binária (_magic bytes_) para `.pdf`, `.docx`, `.doc` e `.txt`. Armazenamento privado no AWS S3 com chaves não enumeráveis e compensação transacional automática em caso de falha de persistência.
- **Análise Inteligente com OpenAI**: envio síncrono do documento e da instrução do usuário à Responses API (`gpt-4o-mini`), garantindo que falhas externas ou timeouts (`502`/`503`) registrem o estado `failed` sem gerar documentos falsamente concluídos.
- **Histórico, Leitura em Markdown e Exclusão**: listagem isolada por proprietário, visualização estruturada da pergunta e da resposta da IA renderizada em Markdown seguro (GFM) e exclusão individual ou múltipla com remoção coordenada entre S3 e banco de dados.
- **Isolamento Estrito por Proprietário**: todas as operações de leitura e mutação filtram recursos pelo `userId` derivado exclusivamente da sessão autenticada.

---

## Arquitetura e Stack Tecnológica

| Camada                | Tecnologias                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| **Front-end**         | React 19, Vite 8, TypeScript 6 (strict), Lucide Icons, `react-markdown` + `remark-gfm` |
| **Back-end**          | Node.js 26 LTS (ESM), NestJS 12, `@nestjs/authentication`, Zod 4                       |
| **Banco de Dados**    | PostgreSQL 18, Drizzle ORM, Drizzle Kit (migrations SQL versionadas)                   |
| **Integrações**       | Google Auth Library, AWS SDK v3 (`@aws-sdk/client-s3`), OpenAI SDK v7                  |
| **Qualidade e CI/CD** | Vitest 4, Supertest, Oxlint (type-aware), Prettier, Docker Compose, GitHub Actions     |

```mermaid
flowchart LR
  User["Usuário (Browser)"] --> Frontend["Front-end (React + Vite)"]
  Frontend -- "REST API + Cookie HttpOnly" --> API["API Back-end (NestJS 12)"]
  API -- "Valida ID Token" --> Google["Google Identity"]
  API -- "Usuários, Sessões e Metadados" --> DB[("PostgreSQL 18")]
  API -- "Objetos Privados" --> S3[("AWS S3")]
  API -- "Documento + Instrução" --> OpenAI["OpenAI (gpt-4o-mini)"]
```

---

## Estrutura do Repositório

O back-end NestJS reside na raiz do repositório e o front-end React é mantido como um pacote independente em `frontend/`, permitindo evolução e deploy desacoplados sem alterar contratos públicos.

```text
.
├── .github/workflows/   # Pipelines de CI e CD (GitHub Actions)
├── docs/                # Fontes de verdade: requisitos, contratos, arquitetura, ADRs e specs
├── drizzle/             # Migrations SQL versionadas do PostgreSQL
├── frontend/            # Aplicação front-end (React 19 + Vite)
│   ├── docker/          # Entrypoint com sincronização automática de dependências
│   ├── src/             # Módulos de autenticação, documentos e componentes UI
│   ├── Dockerfile       # Imagem de desenvolvimento do front-end
│   └── vercel.json      # Rewrites de proxy da API (/api/v1) e fallback SPA
├── infra/               # Infraestrutura como Código (Terraform AWS S3 + IAM)
│   └── main.tf          # Bucket privado, bloqueio público, criptografia AES256 e política IAM
├── src/                 # Aplicação back-end (NestJS 12)
│   ├── auth/            # Autenticação Google, CSRF, guards e store de sessão Postgres
│   ├── config/          # Validação estrita de variáveis de ambiente com Zod
│   ├── database/        # Schema Drizzle, pool de conexão e executor de migrations
│   ├── documents/       # Validação binária, casos de uso, controller e repositório
│   ├── health/          # Health check HTTP (/api/v1/health)
│   ├── integrations/    # Adapters para AWS S3, OpenAI e fakes em memória
│   └── users/           # Domínio e repositório PostgreSQL de usuários
├── test/                # Suítes E2E HTTP e testes de integração PostgreSQL
├── compose.yaml         # Orquestração Docker para front-end, API e PostgreSQL
├── Dockerfile           # Build multi-stage do back-end (development, build e runtime)
└── render.yaml          # Blueprint declarativo (IaC) para deploy do container no Render
```

---

## Começando (Quick Start)

### Pré-requisitos

- **Com Docker (recomendado)**: Docker Engine e Docker Compose v2.
- **Execução direta no host**: Node.js 26 LTS, npm 11+ e PostgreSQL 18.

### Configuração de Variáveis de Ambiente

Crie o arquivo `.env` na raiz a partir do modelo versionado:

```bash
cp .env.example .env
```

Principais variáveis de configuração:

| Variável                  | Descrição                                                  | Valor Padrão (`.env.example`)                                  |
| ------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| `NODE_ENV`                | Ambiente de execução (`development`, `test`, `production`) | `development`                                                  |
| `PORT` / `API_PORT`       | Porta HTTP da API NestJS                                   | `3000`                                                         |
| `FRONTEND_URL`            | Origem permitida no CORS e destino de redirect OAuth       | `http://localhost:5173`                                        |
| `VITE_API_BASE_URL`       | URL base da API consumida pelo front-end                   | `http://localhost:3000/api/v1`                                 |
| `GOOGLE_CLIENT_ID`        | Client ID Web do Google Cloud Console                      | _Obrigatório para login real_                                  |
| `DATABASE_URL`            | String de conexão do PostgreSQL                            | `postgresql://jusdigital:jusdigital@localhost:5433/jusdigital` |
| `OPENAI_API_KEY`          | Chave secreta da OpenAI (exclusiva do back-end)            | _Obrigatório para análise real_                                |
| `OPENAI_MODEL`            | Modelo utilizado na análise de documentos                  | `gpt-4o-mini`                                                  |
| `DOCUMENT_STORAGE_DRIVER` | Driver de storage (`s3` ou `memory` em dev/test)           | `memory`                                                       |
| `AWS_REGION`              | Região do bucket S3                                        | `sa-east-1`                                                    |
| `AWS_S3_BUCKET`           | Nome simples do bucket S3 (sem `arn:` ou `s3://`)          | `jusdigital-documents-dev`                                     |
| `AWS_ACCESS_KEY_ID`       | Access Key IAM restrita ao bucket                          | _(vazio em modo `memory`)_                                     |
| `AWS_SECRET_ACCESS_KEY`   | Secret Key IAM restrita ao bucket                          | _(vazio em modo `memory`)_                                     |

### Execução com Docker Compose (Recomendado)

Suba o front-end, a API e o PostgreSQL com verificação automática de saúde (_health checks_):

```bash
npm run docker:up
npm run docker:ps
```

- **Aplicação Web (Front-end)**: `http://localhost:5173`
- **API Back-end**: `http://localhost:3000/api/v1`
- **Health Check**: `http://localhost:3000/api/v1/health`
- **PostgreSQL (acesso do host)**: `localhost:5433` (usuário/senha/banco: `jusdigital`)

Os códigos-fonte da raiz e de `frontend/` são espelhados nos containers com _hot reload_. O container do front-end sincroniza automaticamente seu volume `node_modules` sempre que `frontend/package-lock.json` é alterado. Caso atualize dependências do back-end, sincronize com:

```bash
docker compose stop api
npm run docker:install
docker compose up --detach --wait api
```

Comandos úteis do ciclo de vida Docker:

```bash
npm run docker:logs   # Acompanha os logs dos serviços
npm run docker:test   # Executa os testes unitários dentro do container da API
npm run docker:down   # Encerra os containers preservando os volumes de dados
```

> Para remover containers **e apagar permanentemente** o volume do banco local, utilize `docker compose down --volumes`.

### Execução Local (Node.js)

Em um terminal, instale as dependências da raiz, aplique as migrations e inicie a API:

```bash
npm install
npm run db:migrate
npm run start:dev
```

Em outro terminal, instale e inicie o front-end React:

```bash
npm run frontend:install
npm run frontend:dev
```

### Migrations do Banco de Dados

O schema relacional (`users`, `sessions`, `documents`) é gerenciado pelo Drizzle ORM:

```bash
npm run db:generate   # Gera novas migrations SQL a partir de src/database/schema.ts
npm run db:migrate    # Aplica as migrations pendentes no PostgreSQL configurado
```

---

## Configuração das Integrações

Para detalhes aprofundados de segurança e arquitetura de integrações, consulte [`docs/integrations/overview.md`](docs/integrations/overview.md).

### Google OAuth 2.0

No **Google Cloud Console** (Credenciais > ID do cliente OAuth 2.0 para Aplicativo da Web), configure:

- **Origens JavaScript autorizadas**: `http://localhost:5173`
- **URIs de redirecionamento autorizados**: `http://localhost:3000/api/v1/auth/google/callback`

> Utilize um navegador padrão para autenticar com contas Google que exijam _passkeys_ ou confirmação em dois fatores.

### AWS S3 (Armazenamento Privado)

Para utilizar armazenamento real no S3:

1. Defina `DOCUMENT_STORAGE_DRIVER=s3` no `.env`.
2. Informe o nome simples do bucket em `AWS_S3_BUCKET` (ex.: `jusdigital-documents-dev-3245`, sem prefixos `arn:aws:s3:::` ou `s3://`).
3. Configure `AWS_REGION`, `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` pertencentes a um usuário IAM com acesso restrito às ações `s3:PutObject`, `s3:GetObject` e `s3:DeleteObject` no bucket privado.

Em caso de indisponibilidade, os logs da API reportam categoria do erro, status HTTP e Request ID do S3 sem jamais expor credenciais, chaves de objeto ou conteúdo do documento.

### OpenAI Responses API

- Configure `OPENAI_API_KEY` exclusivamente no `.env` do back-end.
- O upload envia o documento e a instrução para a Responses API usando `OPENAI_MODEL` (`gpt-4o-mini` por padrão) e só marca o documento como `completed` após persistir uma resposta textual válida.

### Modo de Desenvolvimento sem AWS

O `.env.example` define `DOCUMENT_STORAGE_DRIVER=memory` por padrão em desenvolvimento, permitindo testar todo o fluxo de autenticação Google, upload, análise real com a OpenAI e persistência no PostgreSQL antes de provisionar uma conta AWS. Em `NODE_ENV=production`, o driver em memória é bloqueado por validação de schema.

---

## Resumo da API HTTP

Todas as rotas são prefixadas por `/api/v1`. Requisições autenticadas utilizam cookie de sessão (`credentials: 'include'`). A especificação completa de payloads e códigos de erro está em [`docs/contracts/http-api.md`](docs/contracts/http-api.md).

| Método   | Rota                           | Autenticação  | Descrição                                                                  |
| -------- | ------------------------------ | ------------- | -------------------------------------------------------------------------- |
| `GET`    | `/api/v1/health`               | Pública       | Verificação de saúde da aplicação                                          |
| `POST`   | `/api/v1/auth/google`          | Pública       | Valida Google ID Token (JSON) e cria sessão                                |
| `POST`   | `/api/v1/auth/google/callback` | Pública       | Recebe POST de redirect do Google com validação CSRF                       |
| `GET`    | `/api/v1/auth/me`              | Sessão        | Retorna o perfil do usuário autenticado                                    |
| `POST`   | `/api/v1/auth/logout`          | Sessão        | Revoga a sessão atual e limpa o cookie                                     |
| `POST`   | `/api/v1/documents`            | Sessão        | Upload `multipart/form-data` (`file`, `title`, `instruction`) e análise IA |
| `GET`    | `/api/v1/documents`            | Sessão        | Lista o histórico de documentos do usuário autenticado                     |
| `GET`    | `/api/v1/documents/{id}`       | Sessão (Dono) | Retorna metadados, instrução e análise completa do documento               |
| `DELETE` | `/api/v1/documents/{id}`       | Sessão (Dono) | Remove o objeto no storage e o registro no PostgreSQL (`204`)              |

---

## Testes, Qualidade e CI/CD

A estratégia de testes valida comportamento observável e isolamento entre usuários sem consumir serviços pagos na suíte automatizada. Consulte [`docs/quality/testing.md`](docs/quality/testing.md) para detalhes.

### Comandos de Verificação Local

```bash
# Back-end (Raiz)
npm run lint               # Linting estrito type-aware com Oxlint
npm test                   # Testes unitários (domínio, validadores, serviços e adapters)
npm run test:e2e           # Testes E2E HTTP da API com storage e IA em memória
npm run test:integration   # Testes de integração contra PostgreSQL real + migrations Drizzle
npm run test:cov           # Relatório de cobertura de testes com V8
npm run build              # Compilação de produção do NestJS

# Front-end (frontend/)
npm run frontend:lint      # Linting estrito do front-end com Oxlint
npm run frontend:test      # Testes unitários e de componentes React com Vitest
npm run frontend:build     # Checagem de tipos (tsc -b) e bundle de produção Vite

# Formatação
npm run format             # Formata código e documentação com Prettier
```

### Pipeline de CI/CD (GitHub Actions) e IaC

- **Integração Contínua ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))**: executada em todo `push` e `pull_request` para `main` e `development`. Roda 5 jobs em paralelo sob Node.js 26 LTS (`lint-and-format`, `frontend-quality`, `backend-unit-and-e2e`, `backend-integration` com container `postgres:18-bookworm` e `docker-build`), consolidados pelo gate `ci-status`.
- **Entrega Contínua ([`.github/workflows/cd.yml`](.github/workflows/cd.yml))**: executada em tags `v*` e merges na `main`, publicando as imagens multi-stage da API e do front-end no GitHub Container Registry (`ghcr.io`).
- **Infraestrutura como Código (IaC)**:
  - [`infra/main.tf`](infra/main.tf): manifesto Terraform para provisionamento do bucket AWS S3 privado, bloqueio total de acesso público (`PublicAccessBlock`), criptografia server-side `AES256` e política IAM de privilégio mínimo restrita ao prefixo `users/*`.
  - [`render.yaml`](render.yaml): Blueprint declarativo para implantação do container da API no Render com health check em `/api/v1/health`.
  - [`frontend/vercel.json`](frontend/vercel.json): regras declarativas de rewrite da API (`/api/v1/:path*`) e roteamento SPA na Vercel.

---

## Documentação Técnica e ADRs

O projeto adota **desenvolvimento orientado à documentação**. Todas as decisões de produto, contratos, design e arquitetura estão versionadas em [`docs/`](docs/README.md):

| Tema                                                        | Fonte Canônica                                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Índice Geral da Documentação                                | [`docs/README.md`](docs/README.md)                                               |
| Requisitos Funcionais e de Qualidade                        | [`docs/product/requirements.md`](docs/product/requirements.md)                   |
| Visão Geral da Arquitetura                                  | [`docs/architecture/overview.md`](docs/architecture/overview.md)                 |
| Modelo de Dados Relacional                                  | [`docs/architecture/data-model.md`](docs/architecture/data-model.md)             |
| Especificações de Funcionalidades (`FEAT-001` a `FEAT-011`) | [`docs/features/README.md`](docs/features/README.md)                             |
| Decisões Arquiteturais (`ADR-0001` a `ADR-0009`)            | [`docs/architecture/decisions/README.md`](docs/architecture/decisions/README.md) |
| Contrato da API HTTP                                        | [`docs/contracts/http-api.md`](docs/contracts/http-api.md)                       |
| Integrações Externas (Google, AWS, OpenAI)                  | [`docs/integrations/overview.md`](docs/integrations/overview.md)                 |
| Segurança e Privacidade                                     | [`docs/quality/security.md`](docs/quality/security.md)                           |
| Estratégia de Testes e CI                                   | [`docs/quality/testing.md`](docs/quality/testing.md)                             |
| Diretrizes de Design e Interface                            | [`docs/design/foundations.md`](docs/design/foundations.md)                       |

---

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).
