---
title: Visão geral da arquitetura
status: draft
last_updated: 2026-11-18
---

# Visão geral da arquitetura

## Direção

O sistema é uma aplicação web com front-end e back-end independentes. Neste
repositório, o back-end NestJS permanece na raiz e o front-end React fica em
`frontend/`, com manifesto, dependências e build próprios. Essa organização permite
mover qualquer pacote para outro repositório sem alterar os contratos públicos.

## Componentes

| Componente      | Responsabilidade                                       |
| --------------- | ------------------------------------------------------ |
| Front-end       | Login, upload, listagem, leitura da análise e exclusão |
| API NestJS      | Autenticação, autorização, validação e orquestração    |
| Google Identity | Identidade e dados básicos do perfil                   |
| AWS S3          | Arquivo original privado                               |
| OpenAI          | Análise do documento conforme a instrução              |
| PostgreSQL      | Usuários, metadados, estado e resposta da análise      |

## Fluxo de criação de documento

1. A API autentica e identifica o usuário.
2. Valida título, instrução, tipo e tamanho do arquivo (1 B a 10 MB, magic bytes para
   `.pdf`, `.docx`, `.doc` e `.txt`).
3. Armazena o original no S3 com chave não previsível
   (`users/<userId>/documents/<uuid>.<ext>`).
4. Cria o registro do documento em estado `processing` no PostgreSQL (executando
   remoção compensatória do objeto no S3 caso a gravação no banco falhe).
5. Solicita a análise à OpenAI (`FEAT-005`).
6. Persiste a resposta e muda o estado para `completed`.
7. Em falha da análise, registra estado `failed` sem expor detalhes sensíveis ao
   cliente.

A ordem entre validação, upload no S3 e persistência com compensação está registrada
na [`ADR-0005`](decisions/0005-s3-storage-and-upload-compensation.md).
O processamento síncrono, o envio direto em Base64 e as transições de análise estão
registrados na
[`ADR-0006`](decisions/0006-synchronous-openai-document-analysis.md).

## Fluxo de autenticação

1. O front-end obtém um Google ID token com Google Identity Services.
2. A API valida o token para o Client ID configurado e exige e-mail verificado.
3. O módulo de usuários cria ou atualiza o perfil identificado pelo `sub` do Google.
4. A API emite uma sessão opaca em cookie `HttpOnly`.
5. O guard global exige a sessão por padrão; somente rotas explicitamente públicas
   são anônimas.

A estratégia e seus trade-offs estão registrados na
[`ADR-0001`](decisions/0001-google-id-token-and-server-session.md).

## Ambiente local

Docker Compose orquestra a API em modo de desenvolvimento e PostgreSQL. O banco usa
volume nomeado e health check; a API somente inicia depois de o banco ficar saudável.
A persistência utiliza Drizzle ORM e migrations SQL versionadas conforme a
[`ADR-0004`](decisions/0004-drizzle-orm-and-postgres-persistence.md).

As versões, estágios da imagem e limites desse ambiente estão registrados na
[`ADR-0002`](decisions/0002-docker-development-environment.md).

## Limites obrigatórios

- O front-end nunca recebe credenciais privadas da AWS ou OpenAI.
- Integrações externas ficam atrás de serviços/adapters próprios.
- Controllers tratam HTTP; regras de negócio ficam em serviços de aplicação.
- Persistência não deve vazar detalhes do ORM para os contratos HTTP.
- Toda operação de documento recebe o usuário autenticado como parte da autorização.

## Organização inicial sugerida

```text
src/
├── auth/
├── users/
├── documents/
├── integrations/
│   ├── google/
│   ├── openai/
│   └── storage/
├── database/
├── config/
└── common/
```

Crie módulos apenas quando houver funcionalidade real; não antecipe abstrações sem
uso concreto.

O front-end organiza código por módulo de produto e mantém tokens compartilhados:

```text
frontend/src/
├── app/
├── modules/
│   └── auth/
├── shared/
└── styles/
```

A decisão está registrada na
[`ADR-0007`](decisions/0007-react-vite-colocated-frontend.md).

## Decisões pendentes

- Estratégia de compensação entre banco, S3 e OpenAI.
- Provedor de hospedagem e configuração de produção.
