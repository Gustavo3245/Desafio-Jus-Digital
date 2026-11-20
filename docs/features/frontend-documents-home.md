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
- Layout responsivo para notebook, tela dividida, tablet, 390 px e 320 px.

### Não incluído

- Formulário de título e instrução.
- Envio do arquivo ao endpoint, progresso, análise ou atualização do histórico.
- Listagem, leitura, download ou exclusão no front-end.

## Atores e autorização

- Somente a pessoa com sessão válida acessa a tela.
- A seleção local não envia bytes nem metadados ao servidor nesta entrega.

## Pré-condições

- Sessão autenticada confirmada pelo provider do front-end.

## Fluxo principal

1. A pessoa abre a tela de documentos sem histórico visível.
2. Seleciona a ação ou arrasta um arquivo para a zona tracejada.
3. A interface apresenta o nome do arquivo selecionado e permite substituí-lo.

## Regras de negócio

- `FRONT-DOCS-001` - A ação e a zona de drop abrem o mesmo seletor de arquivos.
- `FRONT-DOCS-002` - A interface anuncia somente os tipos aceitos pelo contrato atual.
- `FRONT-DOCS-003` - Selecionar um arquivo não inicia upload antes do formulário de
  título e instrução existir.
- `FRONT-DOCS-004` - A zona de drop permanece operável por teclado e toque.

## Estados e erros

| Situação            | Comportamento esperado               | Estado visual |
| ------------------- | ------------------------------------ | ------------- |
| Nenhum arquivo      | Exibir orientação e formatos aceitos | Estado vazio  |
| Arquivo sobre zona  | Destacar borda e superfície          | Arraste ativo |
| Arquivo selecionado | Exibir nome e permitir substituição  | Seleção local |

## Contratos afetados

- API: nenhum nesta entrega; contrato futuro em [`../contracts/http-api.md`](../contracts/http-api.md).
- Dados: nenhum.
- Integrações: nenhuma.
- Design: [`../design/documents.md`](../design/documents.md).

## Segurança e privacidade

- O arquivo permanece somente no navegador e não é registrado em logs.
- `accept` melhora a seleção, mas não substitui a validação obrigatória do back-end.

## Critérios de aceitação

- [x] Dado notebook ou tela dividida, então o botão ocupa o canto superior direito
      do painel externo e a zona tracejada aparece como segundo retângulo interno.
- [x] Dado clique, `Enter`, espaço ou drop, então um arquivo pode ser selecionado e
      seu nome é apresentado sem transmissão ao servidor.
- [x] Dados tablet e mobile, então a ação e a zona permanecem visíveis, operáveis e
      sem overflow horizontal.

## Estratégia de teste

- Unitário: build e tipagem dos handlers de seleção.
- Integração: não aplicável até conectar o envio HTTP.
- Visual: notebook, tela dividida, tablet, 390 px e 320 px.

## Observabilidade

- Nenhum log é criado a partir do nome ou conteúdo do arquivo.

## Questões em aberto

- O formulário de prévia deve ser implementado antes de conectar `POST /documents`.

## Evidência de implementação

- Código: `frontend/src/modules/documents/DocumentDropzone.tsx` e estilos da tela.
- Testes: lint, testes e builds registrados na entrega.
- Visual: notebook, 920 px, 768 px, 390 px e 320 px inspecionados no navegador;
  painel e dropzone permaneceram aninhados, a ação manteve a posição prevista e
  não houve overflow horizontal.
- ADRs: nenhuma.
