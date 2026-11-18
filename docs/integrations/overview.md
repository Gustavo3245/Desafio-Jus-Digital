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

- Bucket privado com bloqueio de acesso público.
- IAM limitado às ações e ao bucket necessários.
- Chaves de objeto não previsíveis e associadas ao usuário/documento.
- Download somente após autorização, por streaming ou URL pré-assinada curta.
- Armazenar apenas `storageKey` e metadados no banco.
- Definir compensação para falha entre upload, banco e análise.

## OpenAI

- Modelo exigido: `gpt-4o-mini`.
- A chave permanece exclusivamente no back-end.
- Documento e instrução são enviados pelo serviço de análise.
- Configurar timeout e mapear limite de uso, arquivo inválido e indisponibilidade.
- Não registrar prompts, documentos ou respostas completas em logs.
- Validar a resposta antes de marcar o documento como `completed`.

## Variáveis previstas

```dotenv
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
DATABASE_URL=
OPENAI_API_KEY=
AWS_REGION=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

O `.env.example` deve conter apenas nomes e exemplos não secretos. Em produção,
prefira credenciais temporárias ou IAM Role quando a plataforma permitir.
