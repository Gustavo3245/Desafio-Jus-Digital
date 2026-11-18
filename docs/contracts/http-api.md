---
title: Contrato HTTP
status: accepted
last_updated: 2026-11-18
---

# Contrato HTTP

Base: `/api/v1`. O contrato também deverá ser publicado por OpenAPI, mas este
documento registra semântica, autorização e decisões que não devem depender apenas
de decorators.

## Convenções

- JSON em `camelCase`.
- Datas no formato ISO 8601 em UTC.
- IDs opacos; clientes não inferem significado pelo valor.
- Erros de domínio possuem `code`, `message` e, quando aplicável, `details` seguros.
- Endpoints de documentos exigem usuário autenticado.
- Requisições do navegador enviam cookies com `credentials: 'include'`.

## Endpoints

| Método   | Caminho                    | Finalidade                        |
| -------- | -------------------------- | --------------------------------- |
| `POST`   | `/auth/google`             | Validar Google e criar sessão     |
| `POST`   | `/auth/google/callback`    | Concluir Google redirect          |
| `GET`    | `/auth/me`                 | Obter usuário autenticado         |
| `POST`   | `/auth/logout`             | Encerrar sessão                   |
| `POST`   | `/documents`               | Criar documento e iniciar análise |
| `GET`    | `/documents`               | Listar documentos do usuário      |
| `GET`    | `/documents/{id}`          | Ler metadados e análise           |
| `GET`    | `/documents/{id}/download` | Obter download autorizado         |
| `DELETE` | `/documents/{id}`          | Excluir documento próprio         |

Os endpoints de documentos permanecem propostos até suas respectivas feature specs.

## Autenticação Google

### `POST /api/v1/auth/google`

Endpoint público. Recebe o ID token obtido pelo Google Identity Services:

```json
{
  "credential": "google-id-token"
}
```

Em sucesso, responde `200`, cria a sessão em cookie e retorna somente o perfil
necessário ao cliente:

```json
{
  "user": {
    "id": "opaque-user-id",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "avatarUrl": "https://example.com/avatar.png"
  }
}
```

- Payload ausente ou inválido: `400`.
- Credencial inválida, expirada ou de outra audiência: `401` com
  `INVALID_GOOGLE_CREDENTIAL`.
- E-mail não verificado: `403` com `GOOGLE_EMAIL_NOT_VERIFIED`.

### `POST /api/v1/auth/google/callback`

Endpoint público usado exclusivamente por Google Identity Services com
`ux_mode: "redirect"`. Recebe `application/x-www-form-urlencoded`:

```text
credential=<google-id-token>&g_csrf_token=<random-value>
```

O cookie `g_csrf_token` DEVE existir e ser idêntico ao campo do formulário. Em
sucesso, cria a sessão e responde `303` para `${FRONTEND_URL}/auth/callback`. O
front-end consulta `/auth/me`; nenhuma credencial ou dado pessoal é colocado na URL.

Credencial inválida ou e-mail não verificado redirecionam com um código de erro
seguro no parâmetro `error`. CSRF ausente ou divergente responde `403` sem criar
sessão e sem redirecionar.

### `GET /api/v1/auth/me`

Exige sessão válida. Responde `200` com o mesmo objeto `{ "user": ... }` do login.
Sessão ausente, expirada ou revogada responde `401`.

### `POST /api/v1/auth/logout`

Exige sessão válida. Revoga a sessão atual, limpa o cookie e responde `204`, sem
corpo. Sessão ausente responde `401`.

## Sessão e origem

- Sessão opaca armazenada no servidor, com duração absoluta de sete dias e timeout
  de inatividade de um dia.
- Cookie `HttpOnly`, `SameSite=Lax`, `Path=/` e `Secure` em produção.
- Requisições mutáveis do navegador são aceitas somente da origem configurada em
  `FRONTEND_URL` ou da própria API, exceto o callback dedicado do Google, protegido
  pelo double-submit de `g_csrf_token`.
- CORS permite credenciais apenas para `FRONTEND_URL`.

## Criação de documento

- Content-Type: `multipart/form-data`.
- Campos: `file`, `title`, `instruction`.
- Resposta e status HTTP dependem da decisão sobre processamento síncrono ou assíncrono.
- O cliente nunca envia `userId`, `storageKey`, estado ou resultado da análise.

## Códigos de erro iniciais

| Código                         | Significado                                         |
| ------------------------------ | --------------------------------------------------- |
| `AUTH_REQUIRED`                | Sessão ausente ou inválida                          |
| `INVALID_GOOGLE_CREDENTIAL`    | ID token Google inválido, expirado ou incompatível  |
| `GOOGLE_EMAIL_NOT_VERIFIED`    | A conta Google não possui e-mail verificado         |
| `INVALID_GOOGLE_CSRF_TOKEN`    | Callback Google sem prova CSRF válida               |
| `DOCUMENT_NOT_FOUND`           | Documento inexistente ou não acessível pelo usuário |
| `INVALID_FILE`                 | Tipo, tamanho ou conteúdo rejeitado                 |
| `ANALYSIS_FAILED`              | Falha controlada ao processar a análise             |
| `EXTERNAL_SERVICE_UNAVAILABLE` | Integração temporariamente indisponível             |

Use a mesma resposta para documento inexistente e documento de outro usuário, para
não confirmar a existência de recursos alheios.

## Questões em aberto

- Limites e formato de paginação.
- Status HTTP para análise assíncrona.
- Geração de URL pré-assinada ou streaming pelo back-end.
