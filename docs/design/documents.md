---
title: Design da tela de documentos
status: accepted
last_updated: 2026-11-19
---

# Design da tela de documentos

## Referências canônicas

- Baseline visual: [Figma oficial do desafio](https://www.figma.com/design/fjtXfs1g7LmDqsUToHAohZ/Propostas?node-id=0-1).
- Tokens e princípios: [`foundations.md`](foundations.md).
- Comportamento: [`../features/frontend-documents-home.md`](../features/frontend-documents-home.md).

## Estado vazio e envio

### Notebook e tela dividida

- O título `Documentos` fica fora e acima do painel de envio.
- Um painel branco externo agrupa a ação e a zona de upload.
- `Adicionar documento` fica no canto superior direito do painel externo, com recuo
  consistente em relação às bordas.
- A zona interna possui borda tracejada, ocupa o espaço restante e centraliza ícone,
  título, orientação e formatos aceitos.
- A sidebar permanece lateral enquanto a largura disponível for maior que 820 px.

### Tablet e mobile

- Até 820 px, a sidebar vira uma barra superior e o conteúdo usa uma coluna.
- Até 600 px, a ação ocupa a largura do painel para oferecer alvo de toque de no
  mínimo 44 px; a zona de upload reduz a altura sem perder o conteúdo central.
- O layout não depende de drag and drop: teclado, toque e seletor de arquivos
  oferecem o mesmo ponto de entrada.

## Gestalt e acessibilidade

- Região comum: painel externo conecta a ação ao destino do arquivo.
- Proximidade: ícone, título, instrução e formatos formam um único grupo central.
- Similaridade: verde identifica a ação primária e o estado ativo de arraste.
- O foco é visível, a zona responde a `Enter` e espaço e os estados não dependem
  apenas de cor.

## Limite de fidelidade

O frame público foi inspecionado visualmente no navegador. A integração de camadas
do Figma recusou a sessão por falta de permissão de edição, portanto medidas finas
foram inferidas da renderização pública e validadas no aplicativo real.
