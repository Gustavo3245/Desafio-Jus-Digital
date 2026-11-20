---
title: ADR-0008 - Ordem consistente de exclusão de documentos
status: accepted
date: 2026-11-20
---

# ADR-0008 - Ordem consistente de exclusão de documentos

## Contexto

Um documento possui uma referência no PostgreSQL e um objeto privado no storage.
Sem transação distribuída entre esses serviços, a ordem da exclusão determina qual
falha pode ser compensada e qual estado o usuário observa.

## Restrições e critérios

- Uma falha temporária do storage não deve apagar a referência que permite retry.
- O usuário nunca pode excluir documentos de outro proprietário.
- A entrega não inclui fila ou coordenador de transação distribuída.

## Opções consideradas

### Opção A - Remover banco antes do storage

- Vantagens: a interface deixa de listar o documento imediatamente.
- Desvantagens: falha posterior deixa um objeto órfão sem referência para retry.

### Opção B - Remover storage antes do banco

- Vantagens: falha no storage preserva o registro e permite nova tentativa.
- Desvantagens: falha rara no banco depois do storage pode manter referência sem
  objeto e exige reconciliação futura.

## Decisão

Remover primeiro o objeto no storage e somente depois excluir a referência no banco,
sempre após localizar o documento por ID e proprietário. O contrato permanece
unitário; seleção múltipla é orquestrada pelo cliente.

## Consequências

### Positivas

- Indisponibilidade do storage não produz objeto órfão nem remove o caminho de retry.
- Autorização e semântica de erro permanecem simples e testáveis.

### Negativas ou trade-offs

- Uma falha do banco entre as duas operações requer reconciliação futura.
- Exclusões múltiplas podem concluir parcialmente e exigem recarregar a listagem.

## Plano de validação

- Testar ordem das chamadas e preservação do registro quando o storage falha.
- Testar isolamento entre dois proprietários nos limites de serviço e HTTP.

## Substitui ou é substituída por

- Complementa a [`ADR-0005`](0005-s3-storage-and-upload-compensation.md).
