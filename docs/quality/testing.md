---
title: Estratégia de testes
status: accepted
last_updated: 2026-11-20
---

# Estratégia de testes

## Objetivo

Comprovar o fluxo principal e as fronteiras de segurança com uma suíte pequena,
rápida e confiável. Testes validam comportamento observável, não detalhes internos
sem valor contratual.

## Camadas

### Unitários

- Regras e estados de documentos.
- Validação e tradução de erros.
- Serviços de aplicação com Google, S3 e OpenAI simulados.
- Cada pacote executa somente seus próprios testes: a raiz cobre `src/` e o pacote
  front-end cobre `frontend/src/`.

### Integração

- Repositórios e migrations contra banco de teste.
- Adapters externos usando fakes controlados ou ambientes próprios de teste.
- Configuração e serialização dos contratos.

### E2E

- Login/sessão em cenário controlado.
- Upload até análise concluída.
- Listar e abrir depois de logout e novo login.
- Excluir quando a respectiva feature estiver implementada.
- Isolamento entre dois usuários.
- Arquivo inválido e falha da OpenAI.

## Comandos atuais

```bash
npm test
npm run test:integration
npm run test:e2e
npm run test:cov
npm run lint
npm run build
npm run frontend:lint
npm run frontend:test
npm run frontend:build
```

No ambiente Docker:

```bash
npm run docker:up
npm run docker:test
docker compose exec api npm run lint
docker compose exec api npm run test:integration
docker compose exec api npm run test:e2e
docker compose exec api npm run build
```

A suíte `npm run test:integration` aplica as migrations SQL do Drizzle contra o
serviço `postgres`, limpa as tabelas entre cada caso e valida os repositórios
PostgreSQL, o contrato oficial `authenticationStoreContract` (`concurrent: true`) e
a jornada HTTP completa de autenticação Google, upload e análise com persistência no
banco. Em `NODE_ENV=test`, storage e análise usam adapters em memória; nenhuma chamada
ao S3 ou à OpenAI é realizada.

## Regras

- Cada bug corrigido recebe teste de regressão quando reproduzível.
- Não chame serviços pagos em testes unitários ou na suíte padrão.
- Secrets de teste são fictícios e nunca reutilizam credenciais reais.
- Testes de autorização usam pelo menos dois usuários distintos.
- Mocks preservam contratos e falham explicitamente quando o contrato muda.
- Builds rejeitam símbolos locais e parâmetros sem uso em ambos os pacotes.
- Cobertura é um sinal; critérios de aceitação continuam sendo a referência principal.

## Integração Contínua (GitHub Actions)

O pipeline automatizado em `.github/workflows/ci.yml` é executado a cada `push` ou
`pull_request` direcionado a `development` ou `main`. Ele divide as validações em
jobs paralelos com Node.js 26 LTS:

1. **Lint & Code Style (`lint-and-format`)**:
   - `npx prettier --check` nos fontes, documentação e configurações.
   - `npm run lint` (Oxlint no back-end e testes).
   - `npx tsc -p tsconfig.build.json --noEmit` (tipagem estrita no back-end).
2. **Qualidade do Front-end (`frontend-quality`)**:
   - `npm run frontend:lint` (Oxlint no front-end).
   - `npm run frontend:test` (Vitest nos componentes e clientes de API React).
   - `npm run frontend:build` (compilação de produção com Vite).
3. **Testes Unitários e E2E do Back-end (`backend-unit-and-e2e`)**:
   - `npm test` (testes unitários isolados com mocks rápidos).
   - `npm run test:e2e` (testes de rotas HTTP com storage e IA simulados).
4. **Integração com PostgreSQL (`backend-integration`)**:
   - Inicializa um service container oficial `postgres:18-bookworm`.
   - Executa `npm run test:integration` aplicando migrations Drizzle e validando os
     repositórios, concorrência de sessão e integridade relacional.
5. **Validação de Imagens Docker (`docker-build`)**:
   - Constrói o estágio `runtime` do `Dockerfile` da API.
   - Constrói o `Dockerfile` do front-end.
6. **Barreira de Proteção (`ci-status`)**:
   - Consolida o resultado de todos os jobs anteriores e atua como status check
     obrigatório para regras de proteção de branch.

A entrega contínua para o GitHub Container Registry (GHCR) é gerenciada pelo
workflow `.github/workflows/cd.yml` em tags `v*` e merges em `main`.

## Teste manual da análise real

Com `OPENAI_API_KEY` configurada localmente, execute a API em desenvolvimento com
`DOCUMENT_STORAGE_DRIVER=memory` e inicie `npm run start:manual`. A página em
`http://localhost:5173` percorre Google Auth, upload, Responses API e persistência da
análise. Esse teste consome créditos e nunca deve usar uma chave compartilhada em
chat, logs ou arquivos rastreados.
