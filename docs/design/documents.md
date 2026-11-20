---
title: Design da tela de documentos
status: accepted
last_updated: 2026-11-20
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
- No mobile, o canto superior direito preserva foto, nome, e-mail e logout do mesmo
  componente usado na base da sidebar desktop; textos longos são truncados sem
  remover a identidade da conta.
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

## Histórico, seleção e ações

### Notebook e tela dividida

- Depois do primeiro envio, todos os documentos são exibidos dentro do mesmo painel
  branco externo, em cartões compactos com ícone, título, data, tamanho e extensão.
- A seleção usa superfície azul-clara e marcador azul no canto superior esquerdo;
  cartão, marcador e texto formam uma região clicável única.
- O cabeçalho do painel mantém, da esquerda para a direita, a quantidade total, a
  contagem selecionada e `Adicionar documento`.
- Um documento selecionado revela `Excluir documentos` e `Visualizar análise`; com
  dois ou mais, somente exclusão permanece disponível, como no protótipo.
- As ações contextuais abrem como popover ancorado ao cabeçalho e não participam do
  fluxo da grade; selecionar um cartão não desloca os documentos verticalmente.

### Tablet e mobile

- O cabeçalho e as ações quebram linha sem overflow; `Adicionar documento` mantém
  alvo de toque de 44 px.
- Em larguras de até 600 px, as ações contextuais retornam ao fluxo vertical para não
  cobrir cartões e preservar leitura e alvos de toque.
- Entre 601 px e 1.080 px, exclusão e análise permanecem na linha do cabeçalho como
  botões de ícone rotulados para tecnologias assistivas, evitando cobrir a grade.
- A grade reduz colunas conforme o espaço, sem comprimir cartões ou truncar controles.
- A seleção permanece explícita por texto para leitores de tela e por marcador, não
  apenas pela cor.

## Modal de análise

- `Visualizar análise` abre um modal branco centralizado sobre overlay, com o mesmo
  cabeçalho `Prévia do Documento` do protótipo.
- Metadados, título, instrução e `Análise da IA` são agrupados em regiões separadas;
  conteúdo longo rola dentro do modal.
- Estados `processing` e `failed` recebem mensagens seguras no lugar de uma análise
  inexistente.
- No mobile o modal usa a largura disponível, preserva margens de 12 px e mantém a
  ação de fechar visível.

## Prévia do documento

### Notebook e tela dividida

- A seleção abre um modal branco centralizado sobre overlay cinza, seguindo o frame
  público do protótipo.
- O cabeçalho contém `Prévia do Documento` e a ação de fechar.
- Arquivo, tamanho e tipo formam o primeiro grupo; título e instrução formam o grupo
  de edição; `Salvar` permanece no rodapé, alinhado à direita.
- Campos usam superfície cinza-clara, raio pequeno e foco verde, conforme as fundações.

### Tablet e mobile

- O modal usa a largura disponível com margem mínima de 12 px e altura limitada ao
  viewport.
- O conteúdo possui rolagem interna; o rodapé de ações permanece separado e os botões
  crescem igualmente no mobile.
- Fechar por `Escape` ou backdrop é bloqueado durante o envio para evitar estado
  ambíguo; foco e leitura permanecem contidos no modal nativo.

## Limite de fidelidade

O frame público foi inspecionado visualmente no navegador. A integração de camadas
do Figma recusou a sessão por falta de permissão de edição, portanto medidas finas
foram inferidas da renderização pública e validadas no aplicativo real.
