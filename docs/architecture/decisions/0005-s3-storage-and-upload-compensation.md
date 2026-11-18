---
title: ADR-0005 - Armazenamento privado no AWS S3, validação de arquivo e compensação no upload
status: accepted
date: 2026-11-18
---

# ADR-0005 - Armazenamento privado no AWS S3, validação de arquivo e compensação no upload

## Contexto

O JusDigital precisa receber documentos enviados por usuários autenticados via
`POST /api/v1/documents` (`multipart/form-data`), validar tipo e tamanho com
segurança, armazenar o arquivo original em um bucket AWS S3 privado (`STO-001`,
`STO-003`) e registrar os metadados no PostgreSQL (`STO-002`).

Como o AWS S3 e o PostgreSQL são sistemas independentes sem transação distribuída
2PC, precisamos definir:

1. Como inspecionar e validar o arquivo antes de realizar I/O externo.
2. Qual a ordem entre gravação no S3 e criação do registro no PostgreSQL, e qual a
   compensação executada caso uma das etapas falhe.
3. Como isolar o SDK da AWS atrás de uma abstração que permita testes automatizados
   rápidos e determinísticos sem chamar serviços pagos na suíte padrão.

## Restrições e critérios

- Não confiar apenas em extensão, nome original ou `Content-Type` declarado pelo
  cliente (`docs/quality/security.md`).
- Nunca tornar objetos S3 públicos nem expor `storageKey` nas respostas HTTP.
- Evitar registros no PostgreSQL que apontem para objetos inexistentes no S3 e evitar
  objetos órfãos no S3 quando a persistência no banco falhar.
- Traduzir falhas e timeouts do S3 para `EXTERNAL_SERVICE_UNAVAILABLE` (`503`) sem
  vazar detalhes internos da conta AWS ou stack traces.
- Permitir autenticação na AWS tanto por variáveis `AWS_ACCESS_KEY_ID` e
  `AWS_SECRET_ACCESS_KEY` quanto por IAM Role / Default Credential Provider Chain em
  ambientes gerenciados.

## Opções consideradas

### Opção A - Upload no S3 após validação em memória, seguido de registro no banco com compensação de exclusão no S3

- Vantagens: um registro de documento só passa a existir no PostgreSQL quando o
  arquivo original já está confirmado no S3; se o S3 estiver indisponível, nenhum
  registro inválido é criado; se a inserção no banco falhar após o upload, uma
  chamada compensatória `DeleteObject` remove o objeto recém-enviado.
- Desvantagens: mantém o arquivo validado em buffer de memória até o limite máximo
  permitido (10 MB) durante a requisição de upload.

### Opção B - Criar registro no banco primeiro e depois enviar ao S3

- Vantagens: permite registrar tentativas de upload mesmo quando o S3 está fora do ar.
- Desvantagens: se o upload ao S3 falhar ou o processo cair no meio, o banco fica com
  um documento cuja `storageKey` não existe no bucket, exigindo limpeza no banco ou
  estado adicional de pré-upload.

### Opção C - Upload direto do front-end ao S3 via Presigned POST/PUT

- Vantagens: retira o tráfego do arquivo do servidor Node.js.
- Desvantagens: impede a inspeção síncrona de magic bytes antes do armazenamento e
  exige fluxo em duas etapas no front-end, divergindo do contrato único
  `POST /api/v1/documents` com `multipart/form-data`.

## Decisão

Adotamos a **opção A**:

1. **Validação em memória e inspeção de conteúdo**:
   - Limite de upload de **10 MB** (`10_485_760` bytes) imposto no `Multer` em
     memória e no validador de arquivo.
   - Allowlist de tipos aceitos para análise jurídica:
     - `application/pdf` (`.pdf`, assinatura `%PDF-`);
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
       (`.docx`, container ZIP `PK\x03\x04` contendo estrutura OOXML);
     - `application/msword` (`.doc`, container OLE2 `D0 CF 11 E0 A1 B1 1A E1`);
     - `text/plain` (`.txt`, texto UTF-8 válido sem bytes nulos e não vazio).
   - O `mimeType` persistido é o tipo canônico inspecionado pelo servidor, e a chave
     no S3 segue o padrão não previsível `users/<userId>/documents/<uuid>.<ext>`.
2. **Ordem e compensação**:
   - Primeiro executamos `PutObjectCommand` no S3 com timeout controlado,
     `ServerSideEncryption: 'AES256'` e `ContentDisposition: 'attachment'`.
   - Em seguida gravamos o registro em estado `processing` no PostgreSQL via
     `DocumentsRepository.createProcessing`.
   - Se a gravação no PostgreSQL lançar erro, executamos `DeleteObjectCommand` para a
     `storageKey` recém-enviada antes de encerrar a requisição com erro.
3. **Abstração de armazenamento**:
   - `DocumentStorageService` define o contrato interno (`uploadObject`,
     `getObjectBytes`, `deleteObject`).
   - `S3DocumentStorageService` encapsula `@aws-sdk/client-s3`.
   - `InMemoryDocumentStorageService` é utilizado em `NODE_ENV=test` por padrão,
     enquanto `S3DocumentStorageService` é testado diretamente contra mocks do cliente
     S3 e na integração da aplicação.

## Consequências

### Positivas

- Nenhum documento existe no PostgreSQL sem objeto correspondente no S3.
- Falhas no banco após upload limpam imediatamente o objeto no S3.
- Arquivos com extensão falsificada (ex.: executável renomeado para `.pdf`) são
  bloqueados antes de qualquer chamada à AWS ou ao banco.
- A abstração `DocumentStorageService` já expõe `getObjectBytes` e `deleteObject`,
  prontos para `FEAT-005` (leitura para análise OpenAI) e `FEAT-006` (download e
  exclusão).

### Negativas ou trade-offs

- Caso a conexão com o banco falhe e a chamada compensatória `DeleteObject` ao S3
  também falhe simultaneamente, um objeto órfão pode restar no bucket; uma Lifecycle
  Rule ou rotina futura pode limpar objetos não referenciados se necessário.
- O limite de 10 MB em memória é adequado ao escopo do desafio, mas uploads de
  centenas de megabytes exigiriam streaming.

## Plano de validação

- Testes unitários para o inspetor de arquivos (PDF, DOCX, DOC, TXT, arquivo vazio,
  tamanho excedido e assinatura mágica falsificada).
- Testes unitários para `S3DocumentStorageService` (upload, leitura, exclusão,
  timeout e tradução de erros para `EXTERNAL_SERVICE_UNAVAILABLE`).
- Testes unitários e de integração para `DocumentsService` verificando a compensação
  (`deleteObject` chamado quando `DocumentsRepository.createProcessing` falha).
- Testes E2E e de integração PostgreSQL para `POST /api/v1/documents`.

## Substitui ou é substituída por

- Complementa a [`ADR-0004`](0004-drizzle-orm-and-postgres-persistence.md).
