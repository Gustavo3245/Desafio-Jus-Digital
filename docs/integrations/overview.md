---
title: Integrações externas
status: draft
last_updated: 2026-11-16
---

# Integrações externas

Cada integração deve ficar atrás de uma interface interna, possuir configuração
validada na inicialização e traduzir erros externos para erros do domínio.

## Google OAuth

- O front-end obtém a credencial com Google Identity Services.
- O back-end valida assinatura, emissor, audiência e expiração.
- O identificador estável da conta é `sub`; e-mail não é chave primária.
- O sistema cria ou atualiza o perfil e emite sua própria sessão.
- `GOOGLE_CLIENT_ID` é configuração; nenhum segredo Google vai para o repositório.

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
DATABASE_URL=
GOOGLE_CLIENT_ID=
OPENAI_API_KEY=
AWS_REGION=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
SESSION_SECRET=
FRONTEND_URL=
```

O `.env.example` deve conter apenas nomes e exemplos não secretos. Em produção,
prefira credenciais temporárias ou IAM Role quando a plataforma permitir.
