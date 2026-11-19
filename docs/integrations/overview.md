---
title: Integrações externas
status: draft
last_updated: 2026-11-18
---

# Integrações externas

Cada integração deve ficar atrás de uma interface interna, possuir configuração
validada na inicialização e traduzir erros externos para erros do domínio.

## Google OAuth

- O front-end obtém a credencial com Google Identity Services.
- No modo popup, o front-end envia o ID token uma única vez em
  `POST /api/v1/auth/google`.
- No modo redirect, o Google envia o ID token e `g_csrf_token` ao callback dedicado;
  o back-end compara o token do formulário com o cookie antes de autenticar.
- O back-end usa `google-auth-library` para validar assinatura, emissores Google,
  audiência configurada e expiração.
- O identificador estável da conta é `sub`; e-mail não é chave primária.
- Somente contas com `email_verified = true` são aceitas.
- O sistema cria ou atualiza o perfil e emite sua própria sessão.
- A credencial recebida nunca é persistida ou registrada em logs.
- `GOOGLE_CLIENT_ID` é configuração; nenhum segredo Google vai para o repositório.
- Decisões completas: [`ADR-0001`](../architecture/decisions/0001-google-id-token-and-server-session.md)
  e [`ADR-0003`](../architecture/decisions/0003-google-sign-in-redirect.md).

## AWS S3

- `DOCUMENT_STORAGE_DRIVER=s3` seleciona o adapter S3. Em desenvolvimento local,
  `memory` permite testar o restante do fluxo antes da configuração da AWS; esse
  valor é proibido em produção.
- `AWS_S3_BUCKET` contém somente o nome do bucket. ARN e URI `s3://` são rejeitados na
  inicialização para evitar falha tardia no SDK.
- Bucket privado com bloqueio de acesso público.
- IAM limitado às ações (`s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`) e ao
  bucket necessários.
- Chaves de objeto não previsíveis no formato `users/<userId>/documents/<uuid>.<ext>`.
- Objetos gravados com `ContentDisposition: attachment` e criptografia `AES256`.
- Download somente após autorização, por streaming ou URL pré-assinada curta.
- Armazenar apenas `storageKey` e metadados no banco.
- Compensação automática (`DeleteObject`) se a gravação no banco falhar após o upload,
  conforme [`ADR-0005`](../architecture/decisions/0005-s3-storage-and-upload-compensation.md).

## OpenAI

- A integração usa a Responses API do SDK oficial, atrás de
  `DocumentAnalysisService`.
- O modelo padrão exigido é `gpt-4o-mini`, substituível somente por configuração
  controlada em `OPENAI_MODEL`.
- A chave permanece exclusivamente no back-end.
- Documento e instrução são enviados na mesma requisição como `input_file` em
  Base64 e `input_text`, sem criar um artefato persistente na Files API.
- A chamada usa `store: false`, timeout de 60 segundos, no máximo um retry automático
  e limite de 4.096 tokens de saída.
- Timeout, rate limit e indisponibilidade retornam
  `503 EXTERNAL_SERVICE_UNAVAILABLE`; resposta vazia retorna `502 ANALYSIS_FAILED`.
- Não registrar prompts, documentos ou respostas completas em logs.
- Validar a resposta antes de marcar o documento como `completed`.
- Decisão completa: [`ADR-0006`](../architecture/decisions/0006-synchronous-openai-document-analysis.md).

## Variáveis previstas

```dotenv
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
DATABASE_URL=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
DOCUMENT_STORAGE_DRIVER=memory
AWS_REGION=
AWS_S3_BUCKET=jusdigital-documents-dev-example
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

O `.env.example` deve conter apenas nomes e exemplos não secretos. Em produção,
prefira credenciais temporárias ou IAM Role quando a plataforma permitir.
