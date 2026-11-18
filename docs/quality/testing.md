---
title: Estratégia de testes
status: accepted
last_updated: 2026-11-18
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

### Integração

- Repositórios e migrations contra banco de teste.
- Adapters externos usando fakes controlados ou ambientes próprios de teste.
- Configuração e serialização dos contratos.

### E2E

- Login/sessão em cenário controlado.
- Upload até análise concluída.
- Listar, abrir e excluir.
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
- Cobertura é um sinal; critérios de aceitação continuam sendo a referência principal.
