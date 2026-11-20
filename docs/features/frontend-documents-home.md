---
title: Front-end inicial de documentos
status: implemented
last_updated: 2026-11-20
feature_id: FEAT-009
requirements:
  - DOC-001
  - UX-001
  - UX-002
---

# Front-end inicial de documentos

## Problema

Apresentar a entrada inicial do fluxo de documentos com hierarquia fiel ao protótipo
em notebook e tela dividida, permitindo selecionar um arquivo por clique, teclado ou
drag and drop e mantendo uma adaptação utilizável em tablet e mobile.

## Escopo

### Incluído

- Título, painel branco externo, ação posicionada no painel e zona interna tracejada.
- Seleção local de um arquivo por seletor, teclado ou drag and drop.
- Orientação sobre PDF, DOC, DOCX, TXT e limite de 10 MB.
- Estado visual de arraste e de arquivo selecionado.
- Modal de prévia com metadados, título, instrução, cancelamento e envio.
- Integração autenticada com `POST /api/v1/documents` e feedback de loading, erro e
  sucesso.
- Layout responsivo para notebook, tela dividida, tablet, 390 px e 320 px.
- Carregamento e exibição dos documentos persistidos dentro do painel branco.
- Seleção individual e múltipla, contador e ações contextuais fiéis ao protótipo.
- Modal de análise para uma seleção e exclusão confirmada de uma ou várias seleções.
- Atualização imediata da lista após upload e recarga segura em falha parcial.
- Renderização segura de análises em CommonMark/GFM, carregada sob demanda.

### Não incluído

- Download do arquivo original.

## Atores e autorização

- Somente a pessoa com sessão válida acessa a tela.
- Arquivo, título e instrução são enviados somente após confirmação em `Salvar`.

## Pré-condições

- Sessão autenticada confirmada pelo provider do front-end.

## Fluxo principal

1. A pessoa abre a tela e o histórico próprio é carregado dentro do painel.
2. Sem documentos, seleciona a ação ou arrasta um arquivo para a zona tracejada.
3. A interface abre a prévia com nome, tamanho, tipo, título e instrução.
4. A pessoa confirma `Salvar`; o front-end envia o multipart com a sessão.
5. Em sucesso, o modal fecha e o novo documento aparece na grade.
6. A pessoa seleciona um documento para visualizar sua análise ou seleciona um ou
   vários documentos para confirmar a exclusão.

## Regras de negócio

- `FRONT-DOCS-001` - A ação e a zona de drop abrem o mesmo seletor de arquivos.
- `FRONT-DOCS-002` - A interface anuncia somente os tipos aceitos pelo contrato atual.
- `FRONT-DOCS-003` - Selecionar um arquivo não inicia upload antes da confirmação do
  formulário de título e instrução.
- `FRONT-DOCS-004` - A zona de drop permanece operável por teclado e toque.
- `FRONT-DOCS-005` - O envio usa `credentials: include`, bloqueia submissão duplicada
  e nunca registra arquivo, título ou instrução.
- `FRONT-DOCS-006` - O modal preserva foco, fechamento por teclado e ações acessíveis
  em todos os viewports.
- `FRONT-DOCS-007` - Um documento selecionado permite análise e exclusão; seleção
  múltipla permite somente exclusão.
- `FRONT-DOCS-008` - Exclusão exige confirmação e falha parcial recarrega a fonte de
  verdade antes de exibir erro seguro.
- `FRONT-DOCS-009` - Em notebook, meia tela e tablet, ações contextuais não alteram a
  posição vertical da grade; no mobile estreito elas fluem sem cobrir os cartões.
- `FRONT-DOCS-010` - A barra mobile exibe foto, nome, e-mail e logout da conta sem
  overflow; nome e e-mail longos usam truncamento visual e preservam seu conteúdo
  acessível.
- `FRONT-DOCS-011` - A análise suporta CommonMark/GFM sem executar HTML bruto nem
  carregar imagens remotas; links externos não recebem acesso ao `window.opener`.

## Estados e erros

| Situação            | Comportamento esperado                 | Estado visual |
| ------------------- | -------------------------------------- | ------------- |
| Nenhum arquivo      | Exibir orientação e formatos aceitos   | Estado vazio  |
| Arquivo sobre zona  | Destacar borda e superfície            | Arraste ativo |
| Arquivo selecionado | Abrir prévia e permitir edição         | Modal         |
| Envio em andamento  | Bloquear fechamento e ação duplicada   | Loading       |
| Falha segura        | Manter dados e orientar nova tentativa | Erro no modal |
| Envio concluído     | Fechar modal e confirmar resultado     | Sucesso       |
| Histórico carregado | Exibir cartões dentro do painel branco | Grade         |
| Uma seleção         | Exibir análise e exclusão              | Ações         |
| Várias seleções     | Exibir somente exclusão                | Ações         |
| Exclusão solicitada | Pedir confirmação explícita            | Modal         |

## Contratos afetados

- API: `POST`, `GET` e `DELETE /api/v1/documents` em
  [`../contracts/http-api.md`](../contracts/http-api.md).
- Dados: nenhum.
- Integrações: nenhuma.
- Design: [`../design/documents.md`](../design/documents.md).
- Dependências: `react-markdown` evita parser próprio incompleto e renderiza React sem
  `dangerouslySetInnerHTML`; `remark-gfm` adiciona tabelas, checklists, links literais
  e tachado. Ambas ficam no chunk sob demanda do modal de análise.

## Segurança e privacidade

- O arquivo permanece no navegador até a confirmação e não é registrado em logs.
- `accept` melhora a seleção, mas não substitui a validação obrigatória do back-end.

## Critérios de aceitação

- [x] Dado notebook ou tela dividida, então o botão ocupa o canto superior direito
      do painel externo e a zona tracejada aparece como segundo retângulo interno.
- [x] Dado clique, `Enter`, espaço ou drop, então um arquivo pode ser selecionado e
      a prévia abre sem transmissão imediata ao servidor.
- [x] Dado título e instrução válidos, quando confirma `Salvar`, então o multipart é
      enviado uma vez com sessão e o sucesso é comunicado.
- [x] Dada falha segura da API, então o modal permanece aberto, preserva os campos e
      oferece nova tentativa sem revelar detalhes externos.
- [x] Dados tablet e mobile, então a ação e a zona permanecem visíveis, operáveis e
      sem overflow horizontal.
- [x] Dado histórico persistido, então todos os documentos aparecem dentro do painel
      branco com metadados essenciais e seleção acessível.
- [x] Dado exatamente um documento selecionado, então análise e exclusão ficam
      disponíveis; com vários, somente exclusão fica disponível.
- [x] Dada exclusão confirmada, então a grade reflete a resposta da API e mantém
      consistência após falha parcial.
- [x] Dada análise Markdown, então estruturas textuais são renderizadas com semântica
      e conteúdo ativo não confiável permanece bloqueado.

## Estratégia de teste

- Unitário: cliente de listagem, leitura e exclusão, credenciais e tradução de erro.
- Integração: contrato HTTP existente do back-end.
- Visual: notebook, tela dividida, tablet, 390 px e 320 px.

## Observabilidade

- Nenhum log é criado a partir do nome ou conteúdo do arquivo.

## Evidência de implementação

- Código: `frontend/src/modules/documents/DocumentDropzone.tsx`,
  `DocumentPreviewDialog.tsx`, `DocumentAnalysisDialog.tsx`,
  `DocumentDeleteDialog.tsx`, `documents-api.ts` e estilos da tela.
- Testes: cliente HTTP coberto por testes de multipart, credenciais, resposta e erro
  seguro; lint, testes e builds registrados na entrega.
- Visual: notebook, 920 px, 768 px, 390 px e 320 px inspecionados no navegador;
  painel e dropzone permaneceram aninhados, a ação manteve a posição prevista e
  não houve overflow horizontal.
- Modal: inspecionado em 1366 px, 920 px, 768 px, 390 px e 320 px; cabeçalho, conteúdo
  e rodapé permaneceram contidos, as ações ficaram visíveis e o fechamento por
  `Escape` foi confirmado.
- Histórico e seleção: cartões, seleção única/múltipla, ações contextuais, modal de
  análise e confirmação de exclusão inspecionados em notebook, 920 px, 768 px, 390 px
  e 320 px; sem overflow horizontal.
- Posicionamento contextual: em 920 px e 768 px, a coordenada vertical do primeiro
  cartão permaneceu idêntica antes e depois da seleção; no mobile as ações fluem sem
  overflow ou sobreposição.
- Perfil mobile: foto, nome, e-mail e logout inspecionados com conteúdo longo em 390
  px e 320 px; textos foram truncados visualmente e não houve overflow horizontal.
- Markdown: parser CommonMark/GFM carregado sob demanda, com testes para listas,
  ênfase, tabelas, checklists, links seguros, bloqueio de HTML e imagens remotas.
- Renderização Markdown inspecionada em desktop e 390 px com títulos, lista numerada,
  citação, tabela e código inline; modal e conteúdo permaneceram sem overflow global.
- Verificação em 2026-11-20: lint e builds aprovados, 54 testes unitários, 14 de
  integração, 21 E2E e 14 testes do pacote front-end aprovados.
- ADRs: nenhuma.
