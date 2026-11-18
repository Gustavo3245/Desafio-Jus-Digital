---
title: ADR-0002 - Ambiente Docker para API e PostgreSQL
status: accepted
date: 2026-11-18
---

# ADR-0002 - Ambiente Docker para API e PostgreSQL

## Contexto

O desenvolvimento precisa reproduzir versões de runtime e banco sem exigir que cada
pessoa configure Node.js e PostgreSQL diretamente no host. A persistência da
aplicação ainda não foi implementada, mas o banco deve estar disponível para o
próximo incremento sem antecipar ORM, migrations ou tabelas.

## Restrições e critérios

- Manter Node.js 26 LTS conforme a convenção do repositório.
- Usar somente imagens oficiais e versões explícitas.
- Suportar desenvolvimento com hot reload e uma imagem final enxuta.
- Funcionar em `amd64` e `arm64`.
- Não embutir arquivos `.env`, dependências locais ou histórico Git.
- Preservar os dados locais do PostgreSQL entre recriações de containers.

## Opções consideradas

### Opção A - Dockerfile multi-stage e Docker Compose

- Vantagens: um arquivo cobre desenvolvimento e execução final; o Compose coordena
  health checks, rede e volumes; não requer PostgreSQL no host.
- Desvantagens: bind mounts e volumes exigem cuidado com permissões e limpeza.

### Opção B - Somente PostgreSQL em container

- Vantagens: ciclo de hot reload do Node.js inteiramente no host.
- Desvantagens: não garante a versão do Node.js nem valida a imagem executável da API.

### Opção C - Dev Container como ambiente obrigatório

- Vantagens: integra editor, extensões e terminal no container.
- Desvantagens: acopla o fluxo a ferramentas específicas e adiciona configuração que
  não é necessária para executar ou testar os serviços.

## Decisão

Adotamos a opção A. O back-end usa `node:26.13.1-bookworm-slim`, evitando diferenças
de `musl` do Alpine e mantendo uma base Debian pequena. O banco usa
`postgres:18.7-bookworm`. Ambas são imagens oficiais fixadas por patch.

O Dockerfile possui estágios separados de desenvolvimento, dependências de produção,
build e runtime. O runtime contém somente dependências de produção e `dist`, e executa
como o usuário `node`. O Compose usa o estágio de desenvolvimento com bind mount,
volume isolado para `node_modules` e hot reload.

O PostgreSQL persiste em volume montado em `/var/lib/postgresql`, caminho da imagem
oficial a partir da versão 18. A API depende do health check do banco com
`condition: service_healthy`. `DATABASE_URL` é disponibilizada, mas permanece sem uso
até `FEAT-003` introduzir o adapter de persistência.

## Consequências

### Positivas

- Versões de Node.js e PostgreSQL são consistentes entre máquinas.
- A imagem final é construída pela mesma definição usada no desenvolvimento.
- O banco não perde dados quando apenas os containers são recriados.
- A API não disputa a inicialização com um banco ainda indisponível.

### Negativas ou trade-offs

- Atualizações de patch das imagens são explícitas e precisam de revisão.
- O volume de `node_modules` deve ser recriado após mudanças incompatíveis de
  dependências.
- O ambiente Compose atual é de desenvolvimento e não representa uma implantação de
  produção.

## Plano de validação

- Validar a configuração com `docker compose config`.
- Construir todos os estágios do Dockerfile.
- Subir os serviços e aguardar health checks aprovados.
- Executar a suíte mínima e confirmar o usuário sem privilégios na imagem final.

## Substitui ou é substituída por

- Nenhuma.
