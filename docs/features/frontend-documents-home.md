---
title: Front-end inicial de documentos
status: implemented
last_updated: 2026-11-19
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

### Não incluído

- Listagem, leitura, download ou exclusão no front-end.
- Atualização da listagem após o envio.

## Atores e autorização

- Somente a pessoa com sessão válida acessa a tela.
- Arquivo, título e instrução são enviados somente após confirmação em `Salvar`.

## Pré-condições

- Sessão autenticada confirmada pelo provider do front-end.

## Fluxo principal

1. A pessoa abre a tela de documentos sem histórico visível.
2. Seleciona a ação ou arrasta um arquivo para a zona tracejada.
3. A interface abre a prévia com nome, tamanho, tipo, título e instrução.
4. A pessoa confirma `Salvar`; o front-end envia o multipart com a sessão.
5. Em sucesso, o modal fecha e a zona confirma o documento analisado.

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

## Estados e erros

| Situação            | Comportamento esperado                 | Estado visual |
| ------------------- | -------------------------------------- | ------------- |
| Nenhum arquivo      | Exibir orientação e formatos aceitos   | Estado vazio  |
| Arquivo sobre zona  | Destacar borda e superfície            | Arraste ativo |
| Arquivo selecionado | Abrir prévia e permitir edição         | Modal         |
| Envio em andamento  | Bloquear fechamento e ação duplicada   | Loading       |
| Falha segura        | Manter dados e orientar nova tentativa | Erro no modal |
| Envio concluído     | Fechar modal e confirmar resultado     | Sucesso       |

## Contratos afetados

- API: `POST /api/v1/documents` em [`../contracts/http-api.md`](../contracts/http-api.md).
- Dados: nenhum.
- Integrações: nenhuma.
- Design: [`../design/documents.md`](../design/documents.md).

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

## Estratégia de teste

- Unitário: montagem do multipart, credenciais, resposta e tradução segura de erro.
- Integração: contrato HTTP existente do back-end.
- Visual: notebook, tela dividida, tablet, 390 px e 320 px.

## Observabilidade

- Nenhum log é criado a partir do nome ou conteúdo do arquivo.

## Evidência de implementação

- Código: `frontend/src/modules/documents/DocumentDropzone.tsx`,
  `DocumentPreviewDialog.tsx`, `documents-api.ts` e estilos da tela.
- Testes: cliente HTTP coberto por testes de multipart, credenciais, resposta e erro
  seguro; lint, testes e builds registrados na entrega.
- Visual: notebook, 920 px, 768 px, 390 px e 320 px inspecionados no navegador;
  painel e dropzone permaneceram aninhados, a ação manteve a posição prevista e
  não houve overflow horizontal.
- Modal: inspecionado em 1366 px, 920 px, 768 px, 390 px e 320 px; cabeçalho, conteúdo
  e rodapé permaneceram contidos, as ações ficaram visíveis e o fechamento por
  `Escape` foi confirmado.
- ADRs: nenhuma.
