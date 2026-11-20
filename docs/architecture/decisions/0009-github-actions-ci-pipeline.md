---
title: ADR-0009 - Pipeline de CI/CD com GitHub Actions
status: accepted
date: 2026-11-20
---

# ADR-0009 - Pipeline de CI/CD com GitHub Actions

## Contexto

O JusDigital possui múltiplos componentes e camadas de verificação:

- Back-end NestJS 12 com TypeScript estrito e ESM na raiz;
- Front-end React 19 com Vite e TypeScript em `frontend/`;
- Linter ultrarrápido Oxlint com regras estritas (`noUnusedLocals`, `noUnusedParameters`);
- Formatação de código e documentação padronizada com Prettier;
- Testes unitários e de rotas HTTP com Vitest;
- Testes de integração com banco relacional PostgreSQL 18 e Drizzle ORM;
- Imagens Docker multi-stage com alvos de desenvolvimento e produção (`runtime`).

Era necessário instituir um pipeline de Integração Contínua (CI) e Entrega Contínua (CD)
automatizado, determinístico e executado a cada envio ao repositório, garantindo que
nenhum código com quebra de contrato, regressão ou falha de tipagem atinja as branches
principais.

## Restrições e critérios

- Alinhamento de runtime: execução sob Node.js 26 LTS.
- Rapidez e paralelismo: validações independentes devem rodar simultaneamente para
  manter o ciclo de feedback curto (< 2 minutos).
- Banco real para integração: a suíte `test:integration` requer PostgreSQL para validar
  migrações Drizzle e integridade relacional.
- Isolamento e segurança: nenhum segredo real deve ser manipulado; segredos fictícios
  apenas alimentam esquemas estritos de configuração em `NODE_ENV=test`.
- Facilidade de governança: existir um único status check que proteja branches em Pull
  Requests sem exigir a configuração manual de dezenas de webhooks.

## Opções consideradas

### Opção A - Workflow monolítico sequencial em um único job

Executar todas as tarefas sequencialmente em uma única máquina runner:
`npm ci` -> `prettier` -> `lint` -> `tsc` -> `test` -> `test:e2e` -> `test:integration` -> `docker build`.

- Vantagens:
  - Um único runner provisionado por execução.
- Desvantagens:
  - Tempo de execução elevado (> 4-5 minutos) pois nada roda em paralelo.
  - Feedback lento: falhas no Docker só são descobertas após todos os testes terminarem.
  - Mistura dependências e estados no mesmo ambiente.

### Opção B - Jobs paralelos especializados com service container e barreira de status (Escolhida)

Dividir a pipeline em jobs autônomos executados concorrentemente:

1. `lint-and-format`: estilo, Oxlint e checagem de tipos estrita do back-end.
2. `frontend-quality`: lint, testes unitários/componentes e build do front-end.
3. `backend-unit-and-e2e`: testes rápidos com isolamento em memória.
4. `backend-integration`: testes com PostgreSQL 18 via GitHub Actions service container.
5. `docker-build`: validação de compilação dos Dockerfiles de produção.
6. `ci-status`: gating job sintetizador para regras de proteção de branch do GitHub.
7. Workflow de CD desacoplado para publicação de imagens no GitHub Container Registry (GHCR).

- Vantagens:
  - Feedback imediato: tempo total limitado pelo job mais demorado (~40s a 1 min).
  - Isolamento de falhas: identifica com clareza se o problema é lint, front-end, unitário,
    integração com banco ou container.
  - Utilização ótima da infraestrutura gratuita do GitHub Actions para projetos open source.
- Desvantagens:
  - Pequeno overhead de instalação de dependências em cada runner, mitigado com cache
    `~/.npm` via `actions/setup-node`.

## Decisão

Adotar a **Opção B**, implementando:

1. `.github/workflows/ci.yml` com jobs paralelos, cache de dependências npm, service
   container oficial de PostgreSQL 18 e cancelamento automático de execuções concorrentes
   obsoletas (`cancel-in-progress: true`).
2. `.github/workflows/cd.yml` para publicação de containers no GitHub Container Registry
   (`ghcr.io`), disparado por tags de release (`v*`) e merges na branch `main`.

## Consequências

### Positivas

- Feedback mecânico confiável e rápido antes de qualquer merge em `development` ou `main`.
- Prevenção automática de regressões em regras de negócio, autorização e schema do banco.
- Validação contínua da capacidade de compilação dos containers Docker.
- Padrão moderno de CI com um status unificado (`ci-status`) ideal para Branch Protection Rules.

### Negativas ou trade-offs

- Dependência de conectividade com os servidores e runners do GitHub Actions.
- Runners efêmeros baixam pacotes npm a cada execução, o que é atenuado por caching de lockfile.

## Plano de validação

- Verificação de integridade sintática e validação local das configurações.
- Execução local de todos os passos equivalentes aos jobs de CI.
- Monitoramento da primeira execução no GitHub Actions após o push.

## Substitui ou é substituída por

- Nenhuma (ADR inicial para automação de CI/CD).
