---
title: Qualidade e manutenção do código
status: accepted
last_updated: 2026-11-20
---

# Qualidade e manutenção do código

## Objetivo

Manter o código menor e previsível sem remover caminhos necessários ao fluxo real,
aos testes ou às integrações configuráveis.

## Critérios de auditoria

- Um arquivo só é considerado morto depois de verificar imports, pontos de entrada,
  módulos Nest, scripts, testes e referências na documentação.
- Adapters em memória, teste manual e configurações alternativas são caminhos
  funcionais; não são código morto por ficarem fora do bundle de produção.
- Limites de domínio e valores repetidos devem possuir nomes e uma fonte única dentro
  de cada pacote.
- Funções devem concentrar uma responsabilidade. Tamanho isolado é apenas um sinal:
  marcação JSX declarativa não deve ser fragmentada quando a divisão não reduzir
  estado, ramificações ou duplicação.
- Dependências diretas precisam corresponder a um import, script, peer dependency ou
  necessidade documentada da ferramenta.

## Barreiras automáticas

- Back-end e front-end usam TypeScript estrito com `noUnusedLocals` e
  `noUnusedParameters`.
- O `tsconfig.json` raiz exclui o pacote independente `frontend/`; o front-end é
  validado por `frontend/tsconfig.app.json`.
- A suíte Vitest raiz cobre apenas `src/`; testes em `frontend/src/` pertencem à
  configuração Vitest do front-end e não são executados em duplicidade.
- Lint, testes e builds continuam sendo as verificações obrigatórias definidas em
  [`testing.md`](testing.md).

## Evidência da auditoria de 2026-11-20

- Nenhum arquivo vazio ou módulo de aplicação órfão foi encontrado.
- `.agents`, `.codex` e `.aws` são pontos de integração do ambiente e não pertencem
  ao código da aplicação.
- Limites, formatos e unidades de documentos foram centralizados por pacote.
- Validação repetitiva por extensão foi convertida em tabelas tipadas.
- O painel de documentos foi separado em coordenação, estado e componentes de
  apresentação focados.
- O cliente HTTP de documentos passou a usar um único pipeline de timeout,
  credenciais e erros.
- A suíte unitária raiz deixou de executar novamente testes do pacote front-end.
- A dependência direta sem uso `source-map-support` foi removida; sua ocorrência
  transitiva do Drizzle permanece gerenciada pelo lockfile.
