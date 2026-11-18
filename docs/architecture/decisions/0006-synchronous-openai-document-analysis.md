---
title: ADR-0006 - Análise síncrona de documentos com OpenAI Responses API
status: accepted
date: 2026-11-18
---

# ADR-0006 - Análise síncrona de documentos com OpenAI Responses API

## Contexto

Após o upload privado definido na ADR-0005, o JusDigital precisa enviar o documento
e a instrução do usuário ao modelo exigido pelo produto, persistir a resposta e
devolver a análise no mesmo fluxo HTTP. A integração não pode expor a chave da
OpenAI, reter arquivos remotamente sem necessidade nem marcar um documento como
concluído quando a análise falhar.

## Restrições e critérios

- Usar `gpt-4o-mini` como padrão enquanto esse for o requisito `AI-001`.
- Manter a chave exclusivamente no back-end em `OPENAI_API_KEY`.
- Aceitar os mesmos formatos validados pela FEAT-004: PDF, DOCX, DOC e TXT.
- Não armazenar respostas da OpenAI para recuperação posterior pela API.
- Aplicar timeout, retry limitado e tradução de erros externos.
- Persistir a análise antes de responder sucesso ao cliente.

## Opções consideradas

### Opção A - Análise síncrona no `POST /documents`

- Vantagens: entrega o fluxo principal ponta a ponta com um único contrato HTTP e
  sem infraestrutura adicional.
- Desvantagens: mantém a requisição aberta durante a chamada à OpenAI e limita a
  resiliência a timeouts do navegador ou da infraestrutura.

### Opção B - Análise assíncrona com fila e worker

- Vantagens: desacopla latência e permite retries persistentes.
- Desvantagens: exige broker, worker, polling ou eventos e amplia o escopo antes de
  o fluxo principal estar concluído.

### Opção C - Upload pela Files API e referência por `file_id`

- Vantagens: evita enviar Base64 na requisição de análise e facilita reuso do arquivo.
- Desvantagens: cria um segundo artefato remoto que persiste até exclusão explícita.

## Decisão

Adotamos a opção A com entrada de arquivo em Base64 diretamente na Responses API.
O back-end envia um item `input_file` com nome, MIME type e bytes validados, seguido
da instrução em `input_text`. A requisição usa `store: false`, limite de saída,
timeout e no máximo um retry automático.

O modelo padrão é `gpt-4o-mini`, configurável por `OPENAI_MODEL` para permitir uma
migração controlada sem alterar código quando a substituição do modelo for aprovada.

Após criar o registro `processing`, o serviço solicita a análise. Resposta textual
não vazia transiciona o documento para `completed`. Falha externa ou resposta vazia
transiciona para `failed` com código interno seguro e retorna erro controlado.

## Consequências

### Positivas

- O fluxo de upload já devolve a análise persistida em uma única operação.
- Nenhum arquivo adicional fica persistido na Files API.
- O adapter da OpenAI é substituível por implementação em memória nos testes.
- A resposta remota não é armazenada para recuperação posterior pela OpenAI.

### Negativas ou trade-offs

- Base64 aumenta temporariamente o uso de memória durante a requisição.
- A latência da OpenAI integra o tempo total de `POST /documents`.
- Retry durável e retomada após queda do processo exigirão uma futura evolução
  assíncrona.
- `gpt-4o-mini` está deprecated na documentação atual da OpenAI e deverá ser
  substituído por nova decisão quando o requisito de produto mudar.

## Plano de validação

- Testes unitários do adapter cobrindo payload, resposta vazia, timeout e erro.
- Testes do serviço de documentos cobrindo transições `completed` e `failed`.
- E2E com adapter em memória, sem consumo da API paga.
- Teste real opcional somente com uma chave nova armazenada no `.env` local.

## Substitui ou é substituída por

- Complementa a [`ADR-0005`](0005-s3-storage-and-upload-compensation.md).
