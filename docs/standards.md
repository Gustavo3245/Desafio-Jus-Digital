---
title: Padrão da documentação
status: accepted
last_updated: 2026-11-16
---

# Padrão da documentação

## Metadados

Todo documento normativo deve começar com:

```yaml
---
title: Título legível
status: draft
last_updated: YYYY-MM-DD
---
```

Feature specs também devem declarar `feature_id` e requisitos relacionados. ADRs
usam número, estado e data conforme o template próprio.

## Nomes e linguagem

- Use nomes de arquivo em `kebab-case` e links relativos.
- Escreva em português; preserve nomes técnicos e identificadores em inglês.
- Use **DEVE**, **NÃO DEVE**, **DEVERIA** e **PODE** apenas para regras normativas.
- Dê identificadores estáveis aos requisitos: `AUTH-001`, `DOC-001`, `AI-001`.
- Dê identificadores às funcionalidades: `FEAT-001`.
- Numere ADRs sequencialmente.

## Fonte única

- Requisitos pertencem ao documento de produto.
- Formatos HTTP pertencem ao contrato da API.
- Estruturas persistidas pertencem ao modelo de dados.
- Motivações de escolhas duradouras pertencem a ADRs.
- Feature specs referenciam essas fontes; não copiam seu conteúdo integral.

Quando houver divergência, corrija primeiro a fonte canônica e depois os links ou
resumos dependentes.

## Critério de pronto para implementação

Uma funcionalidade está pronta quando possui escopo, dependências, regras, erros,
critérios de aceitação e estratégia de teste claros. Pontos realmente desconhecidos
devem estar registrados em `Questões em aberto`, sem serem tratados como decisões.

## Critério de concluído

- Critérios de aceitação satisfeitos.
- Testes relevantes passando.
- Contratos e modelo de dados atualizados.
- Riscos de segurança revisados.
- Nenhum segredo ou dado pessoal exposto.
- Estado da feature spec atualizado para `implemented`.
