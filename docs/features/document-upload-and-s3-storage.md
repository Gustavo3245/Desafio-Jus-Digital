---
title: Upload de documentos e armazenamento privado no AWS S3
status: implemented
last_updated: 2026-11-18
feature_id: FEAT-004
requirements:
  - DOC-001
  - STO-001
  - STO-002
  - STO-003
  - SEC-001
  - SEC-002
---

# Upload de documentos e armazenamento privado no AWS S3

## Problema

Permitir que uma pessoa autenticada envie um documento com título e instrução em
`POST /api/v1/documents`, validando rigorosamente os metadados e o conteúdo binário do
arquivo, armazenando o arquivo original de forma privada no AWS S3 com chave não
previsível e persistindo os metadados no PostgreSQL com compensação automática em caso
de falha.

## Escopo

### Incluído

- Configuração e validação das variáveis de ambiente do AWS S3 (`AWS_REGION`,
  `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` e `AWS_S3_ENDPOINT`
  opcional).
- Abstração `DocumentStorageService` com implementações `S3DocumentStorageService`
  (`@aws-sdk/client-s3`) e `InMemoryDocumentStorageService` (para ambiente de teste).
- Validação e inspeção de arquivos enviados (`.pdf`, `.docx`, `.doc`, `.txt`),
  verificando tamanho (1 byte até 10 MB), extensão e assinatura mágica / conteúdo
  binário real.
- Sanitização do nome original do arquivo (`originalName`) e geração de `storageKey`
  privada e não previsível (`users/<userId>/documents/<uuid>.<ext>`).
- Endpoint autenticado `POST /api/v1/documents` (`multipart/form-data`) com campos
  `file`, `title` e `instruction`.
- Orquestração em `DocumentsService` com compensação (`deleteObject` no S3 caso a
  persistência no PostgreSQL falhe após o upload).
- Guia operacional completo de configuração na AWS (S3 Bucket, Block Public Access,
  política IAM de privilégio mínimo) e variáveis locais.

### Não incluído

- Chamada à API da OpenAI (`gpt-4o-mini`) após o upload, coberta por `FEAT-005` (os
  documentos criados nesta etapa permanecem em estado `processing` até `FEAT-005`).
- Endpoints de listagem (`GET /documents`), leitura (`GET /documents/{id}`), download
  (`GET /documents/{id}/download`) e exclusão (`DELETE /documents/{id}`), cobertos
  por `FEAT-006`.

## Atores e autorização

- Apenas uma pessoa autenticada com sessão válida pode enviar documentos em
  `POST /api/v1/documents`.
- O documento criado é vinculado exclusivamente ao `user.id` obtido da sessão no
  servidor; qualquer `userId` enviado pelo cliente é ignorado/rejeitado.

## Pré-condições

- Sessão autenticada criada via Google OAuth (`FEAT-002`).
- Banco PostgreSQL com migrations aplicadas (`FEAT-003`).
- Bucket S3 privado configurado na AWS e credenciais IAM disponíveis no `.env` do
  back-end (em desenvolvimento/produção).

## Fluxo principal

1. O usuário autenticado envia `POST /api/v1/documents` com `multipart/form-data`
   contendo `file`, `title` e `instruction`.
2. O back-end valida a presença e os limites de `title` (1–150 caracteres) e
   `instruction` (1–2.000 caracteres).
3. O inspetor de arquivos valida que `file` existe, possui entre 1 byte e 10 MB e
   cujo conteúdo binário corresponde a um dos formatos suportados (`PDF`, `DOCX`,
   `DOC` ou `TXT`).
4. O serviço gera uma `storageKey` única no formato
   `users/<userId>/documents/<uuid>.<ext>` e envia o buffer ao AWS S3 via
   `DocumentStorageService.uploadObject`.
5. Após confirmação do S3, o serviço cria o registro em estado `processing` no
   PostgreSQL via `DocumentsRepository.createProcessing`.
6. A API responde `201 Created` com `{ "document": ... }` contendo os metadados
   públicos do documento (sem `storageKey`).

## Regras de negócio

- `STO-RULE-001` - O arquivo original DEVE ser validado por tamanho (1 B a 10 MB),
  extensão permitida (`.pdf`, `.docx`, `.doc`, `.txt`) e assinatura binária/textual
  compatível; divergências retornam `400` com código `INVALID_FILE`.
- `STO-RULE-002` - `title` e `instruction` são obrigatórios e não podem conter apenas
  espaços em branco.
- `STO-RULE-003` - `storageKey` é gerada exclusivamente pelo back-end com UUID
  criptográfico (`users/<userId>/documents/<uuid>.<ext>`) e NUNCA é incluída na
  resposta HTTP.
- `STO-RULE-004` - O upload no S3 ocorre antes da criação do registro no banco; se o
  S3 falhar ou atingir timeout, nenhum registro é criado no banco e a API responde
  `503` com `EXTERNAL_SERVICE_UNAVAILABLE`.
- `STO-RULE-005` - Se a gravação no banco falhar após o upload no S3, o back-end DEVE
  executar a remoção compensatória do objeto no S3 antes de propagar a falha.
- `STO-RULE-006` - Em `NODE_ENV=production`, a aplicação exige `AWS_REGION` e
  `AWS_S3_BUCKET` configurados e utiliza obrigatoriamente `S3DocumentStorageService`.

## Estados e erros

| Situação                                               | Comportamento esperado                             | Código/estado                          |
| ------------------------------------------------------ | -------------------------------------------------- | -------------------------------------- |
| Requisição sem sessão válida                           | Rejeitar antes de processar upload                 | `401`                                  |
| Origem não confiável (CSRF)                            | Rejeitar requisição mutável                        | `403`                                  |
| `title` ou `instruction` ausentes/inválidos            | Rejeitar sem chamar S3 nem banco                   | `400`                                  |
| Arquivo ausente, vazio, > 10 MB ou tipo/magic inválido | Rejeitar com `INVALID_FILE` sem chamar S3          | `400` / `INVALID_FILE`                 |
| Falha de rede, permissão ou timeout no AWS S3          | Não criar registro no banco e retornar erro seguro | `503` / `EXTERNAL_SERVICE_UNAVAILABLE` |
| Falha no banco após upload no S3                       | Remover objeto recém-enviado do S3                 | `500` (objeto compensado)              |
| Upload e persistência concluídos                       | Retornar documento em estado `processing`          | `201` / `processing`                   |

## Contratos afetados

- API: [`../contracts/http-api.md`](../contracts/http-api.md).
- Dados: [`../architecture/data-model.md`](../architecture/data-model.md).
- Integrações: [`../integrations/overview.md`](../integrations/overview.md).
- Arquitetura:
  [`ADR-0005`](../architecture/decisions/0005-s3-storage-and-upload-compensation.md).

## Segurança e privacidade

- Credenciais da AWS (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) permanecem apenas
  no back-end e nunca entram no repositório.
- Inspeção de magic bytes impede upload de executáveis ou scripts disfarçados com
  extensão `.pdf` ou `.docx`.
- `originalName` é sanitizado (remoção de diretórios e caracteres de controle) e
  usado apenas para exibição.
- Objetos no S3 são gravados com `ContentDisposition: attachment` e criptografia
  server-side (`AES256`), em bucket sem acesso público.
- Logs de erro nunca incluem o conteúdo do documento nem credenciais da AWS.

## Critérios de aceitação

- [x] Dado um usuário autenticado enviando um arquivo válido (`.pdf`, `.docx`, `.doc`
      ou `.txt`) com `title` e `instruction`, quando `POST /api/v1/documents` é
      chamado, então o objeto é salvo no storage com chave não previsível, o registro
      é persistido no banco com `status = 'processing'` e a resposta é `201` sem expor
      `storageKey`.
- [x] Dado um arquivo ausente, vazio, maior que 10 MB ou com assinatura binária
      incompatível com a extensão, quando o upload é enviado, então a resposta é `400`
      com `code: 'INVALID_FILE'` e nada é gravado no storage ou no banco.
- [x] Dada uma falha ou timeout no AWS S3 durante o upload, quando
      `POST /api/v1/documents` é chamado, então a resposta é `503` com
      `code: 'EXTERNAL_SERVICE_UNAVAILABLE'` e nenhum registro é criado no banco.
- [x] Dada uma falha ao persistir no banco após o upload no S3, quando o serviço
      processa a criação, então o objeto recém-enviado é removido do S3 por
      compensação.
- [x] Dada uma requisição não autenticada para `POST /api/v1/documents`, quando
      enviada, então a resposta é `401` e nenhum arquivo é armazenado.

## Estratégia de teste

- Unitário: validador/inspetor de arquivos (`PDF`, `DOCX`, `DOC`, `TXT`, falsificação
  de magic bytes, limites de tamanho), `S3DocumentStorageService` (com cliente S3
  simulado cobrindo upload, leitura, exclusão e erros) e `DocumentsService`
  (orquestração e compensação de falha entre S3 e banco).
- Integração: jornada HTTP completa combinando Google Auth (`FEAT-002`), PostgreSQL
  (`FEAT-003`) e Upload de documentos (`FEAT-004`).
- E2E: testes HTTP de `POST /api/v1/documents` cobrindo sucesso para os formatos
  suportados, rejeição de arquivo inválido (`INVALID_FILE`), validação de campos,
  proteção de autenticação/CSRF e indisponibilidade do storage.

## Observabilidade

- Falhas de integração com o S3 podem registrar apenas o código/categoria do erro AWS
  e identificador de requisição, sem expor credenciais, chaves secretas ou bytes do
  documento.

## Questões em aberto

- O acionamento automático da análise OpenAI (`gpt-4o-mini`) logo após o upload será
  conectado em `FEAT-005`.

## Evidência de implementação

- Código: `src/integrations/storage/`, `src/documents/document-file-validator.ts`,
  `src/documents/documents.service.ts`, `src/documents/documents.controller.ts`,
  `src/config/environment.schema.ts`, `.env.example` e `compose.yaml`.
- Testes: `npm run lint` (0 avisos/erros em 52 arquivos), `npm test` (11 suítes,
  30 testes unitários), `npm run test:integration` (14 testes contra PostgreSQL,
  incluindo upload HTTP via `POST /api/v1/documents`), `npm run test:e2e` (2 suítes,
  15 testes E2E HTTP) e `npm run build`, validados em 2026-11-18.
- ADRs:
  [`ADR-0005`](../architecture/decisions/0005-s3-storage-and-upload-compensation.md).
