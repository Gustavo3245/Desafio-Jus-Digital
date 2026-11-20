---
title: Análise de documentos com OpenAI
status: implemented
last_updated: 2026-11-20
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
- Página local para teste manual autenticado da integração real, usando storage em
  memória enquanto a AWS não estiver configurada.
- Persistência textual de respostas Markdown e renderização segura de CommonMark/GFM
  no modal do front-end.

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
- `AI-RULE-007` - A análise é persistida como texto original; Markdown é interpretado
  somente na apresentação, sem habilitar HTML bruto ou imagens remotas.

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
- O front-end não usa `dangerouslySetInnerHTML`; HTML bruto e imagens Markdown são
  descartados, e links externos usam isolamento de `opener`.

## Critérios de aceitação

- [x] Dado um upload válido, quando a OpenAI retorna texto, então o documento é
      persistido como `completed` e a API retorna a análise.
- [x] Dada uma falha externa, quando a análise é solicitada, então o documento fica
      `failed` e a API retorna `503` sem expor detalhes externos.
- [x] Dada uma resposta vazia, quando a análise é processada, então o documento fica
      `failed` e a API retorna `502` com `ANALYSIS_FAILED`.
- [x] Nenhum teste padrão realiza chamada real ou consome créditos da OpenAI.
- [x] Respostas Markdown válidas são apresentadas semanticamente sem executar HTML
      bruto nem carregar imagens remotas.

## Estratégia de teste

- Unitário: payload do adapter, resposta válida/vazia e tradução de falhas.
- Serviço: transições `processing` → `completed` e `processing` → `failed`.
- E2E: upload autenticado usando adapter em memória.
- Manual opcional: Google Auth, upload e resposta real da OpenAI em
  `http://localhost:5173`.

## Observabilidade

- Registrar apenas categoria da falha, identificador interno do documento e
  correlação; nunca documento, instrução, análise, chave ou resposta externa.

## Questões em aberto

- O processamento poderá migrar para fila e worker se a latência síncrona prejudicar
  a experiência ou os limites da infraestrutura.

## Evidência de implementação

- Código: `src/integrations/openai/`, conexão em
  `src/documents/documents.service.ts`, configuração validada em
  `src/config/environment.schema.ts`, `.env.example` e `compose.yaml`.
- Testes do adapter verificam Base64, `store: false`, resposta válida/vazia e
  tradução de falhas. Serviço, E2E e integração verificam as transições
  `processing` → `completed` e `processing` → `failed`.
- Verificação em 2026-11-18: `npm run lint`, `npm test` (12 suítes/36 testes),
  `npm run test:integration` (1 suíte/14 testes), `npm run test:e2e` (2 suítes/17
  testes) e `npm run build`.
