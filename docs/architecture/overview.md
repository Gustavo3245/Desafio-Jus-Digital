---
title: Visão geral da arquitetura
status: draft
last_updated: 2026-11-18
---

# Visão geral da arquitetura

## Direção

O sistema será uma aplicação web com front-end e back-end independentes. Neste
repositório, o back-end NestJS está na raiz. Essa organização permite mover o
front-end ou o back-end para outro repositório sem alterar os contratos públicos.

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
2. Valida título, instrução, tipo e tamanho do arquivo.
3. Cria o registro do documento em estado `processing`.
4. Armazena o original no S3 com chave não previsível.
5. Solicita a análise à OpenAI.
6. Persiste a resposta e muda o estado para `completed`.
7. Em falha, registra estado `failed` sem expor detalhes sensíveis ao cliente.

A ordem exata e a compensação em falhas devem ser decididas em ADR antes da
implementação, principalmente para evitar arquivos órfãos ou registros sem arquivo.

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
`DATABASE_URL` já é entregue ao container, mas nenhum módulo usa a conexão antes da
decisão de ORM e migrations em `FEAT-003`.

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

## Decisões pendentes

- ORM e estratégia de migrations.
- Processamento síncrono ou assíncrono da análise.
- Estratégia de compensação entre banco, S3 e OpenAI.
- Provedor de hospedagem e configuração de produção.
