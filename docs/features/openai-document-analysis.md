---
title: Análise de documentos com OpenAI
status: in_progress
last_updated: 2026-11-18
feature_id: FEAT-005
requirements:
  - AI-001
  - AI-002
  - AI-003
  - SEC-001
---

# Análise de documentos com OpenAI

## Problema

Enviar o documento validado e a instrução do usuário à OpenAI, receber uma análise
textual, persistir o resultado e retornar somente um estado verdadeiro e verificável
ao cliente.

## Escopo

### Incluído

- Configuração de `OPENAI_API_KEY` e `OPENAI_MODEL` exclusivamente no back-end.
- Adapter para OpenAI Responses API usando o SDK oficial.
- Envio de PDF, DOCX, DOC ou TXT como `input_file` em Base64 e da instrução como
  `input_text`.
- Resposta não persistida na OpenAI (`store: false`), timeout, retry limitado e
  limite de tokens de saída.
- Persistência de sucesso como `completed` e falha como `failed`.
- Adapter em memória para testes sem chamadas externas pagas.

### Não incluído

- Fila, worker, processamento em background ou retry durável.
- Chat contínuo, histórico de prompts ou novas perguntas sobre a mesma análise.
- Escolha de modelo pelo usuário final.

## Atores e autorização

- Somente a pessoa autenticada que envia o documento inicia a análise.
- O `userId` é obtido da sessão e acompanha todas as transições no repositório.

## Pré-condições

- Arquivo, título e instrução validados pela FEAT-004.
- Documento original armazenado e registro `processing` persistido.
- Chave válida disponível em `OPENAI_API_KEY` fora do repositório.

## Fluxo principal

1. `POST /api/v1/documents` valida e armazena o documento.
2. O registro é criado como `processing`.
3. O adapter envia arquivo e instrução à Responses API.
4. Uma resposta textual não vazia é persistida com estado `completed`.
5. A API responde `201` com a análise persistida.

## Regras de negócio

- `AI-RULE-001` - A chave da OpenAI nunca é enviada ao cliente, persistida no banco
  ou registrada em logs.
- `AI-RULE-002` - O modelo padrão é `gpt-4o-mini`; alteração de modelo ocorre apenas
  por configuração controlada.
- `AI-RULE-003` - O documento e a instrução são enviados em uma única requisição de
  análise, com `store: false`.
- `AI-RULE-004` - Somente resposta textual não vazia pode produzir estado
  `completed`.
- `AI-RULE-005` - Timeout, limite, indisponibilidade ou resposta inválida produzem
  estado `failed`, nunca `completed`.
- `AI-RULE-006` - Conteúdo integral do documento, prompt e resposta não aparecem em
  logs de aplicação.

## Estados e erros

| Situação                            | Comportamento esperado                  | Código/estado                          |
| ----------------------------------- | --------------------------------------- | -------------------------------------- |
| Chave ausente                       | Rejeitar inicialização                  | erro de configuração                   |
| Resposta textual válida             | Persistir análise                       | `201` / `completed`                    |
| Timeout, rate limit ou erro externo | Persistir falha e responder erro seguro | `503` / `EXTERNAL_SERVICE_UNAVAILABLE` |
| Resposta vazia ou inválida          | Persistir falha e responder erro seguro | `502` / `ANALYSIS_FAILED`              |

## Contratos afetados

- API: [`../contracts/http-api.md`](../contracts/http-api.md).
- Dados: [`../architecture/data-model.md`](../architecture/data-model.md).
- Integrações: [`../integrations/overview.md`](../integrations/overview.md).
- Arquitetura:
  [`ADR-0006`](../architecture/decisions/0006-synchronous-openai-document-analysis.md).

## Segurança e privacidade

- A requisição usa `store: false` para não disponibilizar a resposta para recuperação
  posterior pela API.
- O arquivo em Base64 existe somente durante a chamada e não é escrito em logs.
- Erros externos são convertidos em categorias internas sem corpo de resposta ou
  identificadores da OpenAI.

## Critérios de aceitação

- [ ] Dado um upload válido, quando a OpenAI retorna texto, então o documento é
      persistido como `completed` e a API retorna a análise.
- [ ] Dada uma falha externa, quando a análise é solicitada, então o documento fica
      `failed` e a API retorna `503` sem expor detalhes externos.
- [ ] Dada uma resposta vazia, quando a análise é processada, então o documento fica
      `failed` e a API retorna `502` com `ANALYSIS_FAILED`.
- [ ] Nenhum teste padrão realiza chamada real ou consome créditos da OpenAI.

## Estratégia de teste

- Unitário: payload do adapter, resposta válida/vazia e tradução de falhas.
- Serviço: transições `processing` → `completed` e `processing` → `failed`.
- E2E: upload autenticado usando adapter em memória.

## Observabilidade

- Registrar apenas categoria da falha, identificador interno do documento e
  correlação; nunca documento, instrução, análise, chave ou resposta externa.

## Questões em aberto

- O processamento poderá migrar para fila e worker se a latência síncrona prejudicar
  a experiência ou os limites da infraestrutura.

## Evidência de implementação

Preencher somente ao mudar o estado para `implemented`.
