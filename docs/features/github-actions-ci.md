---
title: Pipeline de CI/CD com GitHub Actions
status: implemented
last_updated: 2026-11-20
feature_id: FEAT-010
requirements:
  - DEV-004
---

# Pipeline de CI/CD com GitHub Actions

## Problema

Garantir que todas as alterações enviadas ao repositório (via push ou pull request)
sejam validadas automaticamente de forma rápida, reproduzível e isolada, cobrindo
estilo de código, tipagem estrita, linting, testes unitários, testes de ponta a
ponta (E2E), testes de integração com PostgreSQL real, suíte do front-end e
construção de imagens Docker de produção.

## Escopo

### Incluído

- Workflow de Integração Contínua (`.github/workflows/ci.yml`) acionado em `push` e
  `pull_request` para os ramos `main` e `development`, além de disparo manual
  (`workflow_dispatch`).
- Cancelamento automático de execuções concorrentes redundantes no mesmo branch ou PR.
- Matriz/conjunto de jobs paralelos executando no runner oficial Ubuntu com Node.js 26 LTS:
  - `lint-and-format`: verificação de estilo com Prettier, linting com Oxlint e checagem de
    tipos com `tsc` no back-end.
  - `frontend-quality`: linting com Oxlint, testes com Vitest e compilação do front-end
    React com Vite.
  - `backend-unit-and-e2e`: testes unitários e de API HTTP com fakes em memória.
  - `backend-integration`: testes de integração do repositório PostgreSQL e Drizzle ORM
    contra um service container oficial do PostgreSQL 18.
  - `docker-build`: validação da construção das imagens Docker do back-end (`runtime`) e do
    front-end.
  - `ci-status`: job unificador que atua como barreira obrigatória (gate) para proteção de
    branches.
- Workflow de Entrega Contínua (`.github/workflows/cd.yml`) para publicação de imagens no
  GitHub Container Registry (GHCR) ao gerar tags `v*` ou merge na branch `main`.
- Cache inteligente de dependências npm (`~/.npm`) indexado por `package-lock.json`.

### Não incluído

- Deploy automático em ambiente de nuvem proprietário (AWS ECS/EKS/Cloud Run) sem
  credenciais de produção provisionadas.
- Execução de testes de carga ou penetração no pipeline padrão.
- Chamadas a APIs externas pagas (OpenAI e AWS S3 real) no pipeline; os testes usam
  fakes/memory drivers controlados.

## Atores e autorização

- Autores de código acionam o pipeline automaticamente ao abrir ou atualizar PRs e commits.
- O pipeline roda em runners do GitHub Actions utilizando `GITHUB_TOKEN` com escopos
  mínimos necessários (`contents: read` no CI; `packages: write` no CD).

## Pré-condições

- Repositório Git com arquivos de configuração de dependências (`package.json`,
  `package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`).

## Fluxo principal

1. Uma pessoa desenvolvedora cria um commit ou abre um Pull Request para `development` ou
   `main`.
2. O GitHub Actions inicia o workflow de CI.
3. Os jobs `lint-and-format`, `frontend-quality`, `backend-unit-and-e2e`,
   `backend-integration` e `docker-build` iniciam em paralelo.
4. O job `backend-integration` provisiona o container `postgres:18-bookworm`, aguarda o
   health check e executa as migrations do Drizzle e a suíte de persistência.
5. Cada job conclui suas validações e reporta o resultado ao GitHub.
6. O job unificador `ci-status` avalia todos os resultados e aprova a verificação do PR.

## Regras de negócio

- `CI-RULE-001` - O pipeline deve utilizar rigorosamente Node.js 26 LTS, espelhando a
  versão definida na arquitetura do projeto.
- `CI-RULE-002` - Nenhuma credencial ou segredo real de produção pode ser injetado no CI;
  chaves fictícias são usadas exclusivamente para satisfazer os esquemas de ambiente em
  modo de teste.
- `CI-RULE-003` - O pipeline falhará se houver erros de formatação Prettier, erros de
  linting Oxlint ou erros de tipagem estrita do TypeScript.
- `CI-RULE-004` - Testes de integração devem executar contra uma instância PostgreSQL 18
  real para validar as migrações SQL do Drizzle e as restrições relacionais de chave
  estrangeira e exclusão em cascata.
- `CI-RULE-005` - As imagens Docker de produção do back-end e front-end devem ser
  construídas no CI para prevenir quebras no Dockerfile antes do merge.

## Estados e erros

| Situação                            | Comportamento esperado                                                    | Código/estado |
| ----------------------------------- | ------------------------------------------------------------------------- | ------------- |
| Erro de formatação ou linting       | Pipeline falha imediatamente com relatório de linha e regra violada       | `failure`     |
| Erro em teste unitário ou E2E       | Job específico falha com pilha do Vitest                                  | `failure`     |
| Falha na migração ou teste Postgres | Job de integração falha; banco é descartado com o container efêmero       | `failure`     |
| Erro na compilação Docker           | Job `docker-build` falha apontando a instrução do Dockerfile com problema | `failure`     |
| Todos os jobs aprovados             | Status final de sucesso reportado ao GitHub                               | `success`     |

## Contratos afetados

Nenhum contrato de API pública HTTP é alterado; o pipeline automatiza a verificação
mecânica de todos os contratos existentes.

## Critérios de aceitação

- [x] O arquivo `.github/workflows/ci.yml` está presente e com sintaxe YAML válida.
- [x] Os jobs de linting, testes unitários, testes de integração, testes do front-end e build
      Docker estão configurados.
- [x] O job de integração usa container de serviço oficial do PostgreSQL 18 com health check.
- [x] Cache de dependências npm está habilitado para acelerar as execuções.
- [x] O arquivo `.github/workflows/cd.yml` está configurado para empacotamento de containers.
- [x] Toda a documentação técnica relevante (`docs/quality/testing.md`, `README.md`) reflete
      a estratégia de CI/CD.
