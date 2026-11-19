---
title: ADR-0007 - Front-end React e Vite co-localizado
status: accepted
date: 2026-11-19
---

# ADR-0007 - Front-end React e Vite co-localizado

## Contexto

O back-end NestJS foi iniciado na raiz e precisa continuar separável, mas o desafio
deve ser entregue em um único repositório. A interface exige componentes, estados e
responsividade suficientes para justificar uma aplicação cliente estruturada.

## Restrições e critérios

- TypeScript estrito e fluxo Google compatível com cookie `HttpOnly`.
- Desenvolvimento e build independentes do NestJS.
- Possibilidade de mover `frontend/` para outro repositório no futuro.
- Menor conjunto de dependências que cubra a interface atual.

## Opções consideradas

### Opção A - React com Vite em `frontend/`

- Vantagens: limites claros, componentes reutilizáveis, build rápido e ecossistema
  adequado aos próximos módulos.
- Desvantagens: segundo pacote e pipeline de build.

### Opção B - HTML e JavaScript dentro do NestJS

- Vantagens: menos configuração inicial.
- Desvantagens: acopla apresentação à API e torna estados e evolução visual frágeis.

### Opção C - Framework React full-stack

- Vantagens: roteamento e renderização no servidor integrados.
- Desvantagens: duplica responsabilidades já atendidas pelo NestJS e amplia o escopo.

## Decisão

Usar React e Vite em um pacote independente `frontend/`, sem npm workspace. O
repositório raiz oferece comandos de conveniência e o Docker Compose executa ambos,
mas cada pacote mantém manifesto e lockfile próprios. A aplicação usa `fetch` nativo,
Context para a sessão e roteamento mínimo baseado na URL até haver necessidade real
de uma biblioteca de rotas.

Dependências de produção iniciais:

- `react` e `react-dom` para composição e estado da interface.
- `lucide-react` para ícones lineares consistentes e acessíveis.
- `@fontsource-variable/inter` para servir localmente a tipografia aprovada.

## Consequências

### Positivas

- Front-end e API podem evoluir, testar e ser extraídos separadamente.
- Nenhuma credencial privada entra no bundle; apenas Client ID e URL públicos.
- Evita dependências prematuras de roteamento ou estado remoto.

### Negativas ou trade-offs

- Dois lockfiles e dois comandos de instalação precisam ser mantidos.
- Produção exigirá definir hospedagem e entrega do bundle em decisão posterior.

## Plano de validação

- Build e testes independentes dos dois pacotes.
- Fluxo Google real, reload de sessão e logout contra a API local.
- Revisão visual em desktop e mobile.

## Substitui ou é substituída por

- Nenhuma.
