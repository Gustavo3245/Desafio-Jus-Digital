---
title: Autenticação com conta Google
status: implemented
last_updated: 2026-11-19
feature_id: FEAT-002
requirements:
  - AUTH-001
  - AUTH-002
  - AUTH-003
---

# Autenticação com conta Google

## Problema

Permitir que uma pessoa acesse o JusDigital usando sua conta Google, sem criar
ou armazenar uma senha local, e manter uma sessão própria que possa ser revogada
pelo back-end.

## Escopo

### Incluído

- Receber um Google ID token obtido pelo front-end com Google Identity Services.
- Receber a mesma credencial pelo callback de redirecionamento do Google.
- Validar assinatura, emissor, audiência, validade e e-mail verificado do token.
- Criar ou atualizar o perfil local identificado de forma estável pelo `sub`.
- Criar uma sessão opaca em cookie seguro e disponibilizar o usuário autenticado.
- Encerrar a sessão atual.

### Não incluído

- Interface ou integração do front-end com o botão do Google.
- Persistência em PostgreSQL de usuários e sessões, coberta por `FEAT-003`.
- Autorização por papéis ou permissões administrativas.
- Vinculação de múltiplos provedores de identidade à mesma conta.

## Atores e autorização

- Uma pessoa não autenticada inicia o login com uma credencial emitida pelo Google.
- Apenas a pessoa dona da sessão pode consultar sua própria identidade e encerrar a
  sessão.

## Pré-condições

- O front-end possui um Google OAuth Client ID do tipo Web.
- O mesmo Client ID está configurado no back-end como `GOOGLE_CLIENT_ID`.
- A origem do front-end está configurada como `FRONTEND_URL`.

## Fluxo principal

1. O front-end inicia o Google Identity Services em modo popup ou redirect.
2. No modo popup, envia a credencial JSON para `POST /api/v1/auth/google`; no modo
   redirect, o Google envia um formulário para `POST /api/v1/auth/google/callback`.
3. O back-end valida a credencial diretamente com a biblioteca oficial do Google.
4. O back-end cria ou atualiza o usuário local usando `sub` como identidade externa.
5. O back-end cria uma sessão opaca e envia seu identificador em cookie `HttpOnly`.
6. O cliente consulta `GET /api/v1/auth/me` para obter o perfil da sessão.
7. O cliente encerra a sessão em `POST /api/v1/auth/logout`.

## Regras de negócio

- `AUTH-RULE-001` - Somente um ID token válido para o `GOOGLE_CLIENT_ID` configurado
  pode iniciar uma sessão.
- `AUTH-RULE-002` - O campo `sub` do Google é a identidade externa canônica; e-mail
  não pode ser usado como chave de identidade.
- `AUTH-RULE-003` - O e-mail informado pelo Google deve estar verificado.
- `AUTH-RULE-004` - Nome, e-mail e avatar locais são atualizados a cada login válido.
- `AUTH-RULE-005` - A credencial Google nunca é persistida nem escrita em logs.
- `AUTH-RULE-006` - Sessões são armazenadas somente em memória até `FEAT-003` e a
  aplicação recusa inicialização em produção nessa condição.
- `AUTH-RULE-007` - O callback de redirecionamento exige que o `g_csrf_token` do
  cookie e do formulário sejam não vazios e idênticos.
- `AUTH-RULE-008` - O retorno do callback usa somente a origem configurada no
  back-end e nunca inclui a credencial Google na URL.
- `AUTH-RULE-009` - O cliente manual encerra a verificação inicial em tempo finito e
  informa separadamente sessão ausente, API indisponível, SDK Google indisponível e
  abertura incorreta por `file://`.
- `AUTH-RULE-010` - O callback pode normalizar `Origin: null` somente depois de
  validar o double-submit CSRF e somente quando `Sec-Fetch-Site` for `cross-site`;
  nenhuma outra rota confia em origem opaca.

## Estados e erros

| Situação                                          | Comportamento esperado              | Código/estado |
| ------------------------------------------------- | ----------------------------------- | ------------- |
| Payload inválido ou ausente                       | Rejeitar sem chamar o Google        | `400`         |
| ID token inválido, expirado ou de outra audiência | Não criar usuário nem sessão        | `401`         |
| E-mail Google não verificado                      | Não criar usuário nem sessão        | `403`         |
| Sessão ausente ou inválida                        | Não expor dados de usuário          | `401`         |
| Login válido                                      | Criar sessão e retornar perfil      | `200`         |
| Callback válido                                   | Criar sessão e voltar ao front-end  | `303`         |
| CSRF ausente ou divergente no callback            | Não validar nem criar sessão        | `403`         |
| Logout válido                                     | Revogar a sessão e limpar o cookie  | `204`         |
| Página manual aberta diretamente como arquivo     | Orientar abertura pelo Vite         | Erro local    |
| API ou SDK Google sem resposta                    | Encerrar espera e orientar correção | Erro local    |

## Contratos afetados

- API: [`../contracts/http-api.md`](../contracts/http-api.md).
- Dados: [`../architecture/data-model.md`](../architecture/data-model.md).
- Integrações: [`../integrations/overview.md`](../integrations/overview.md).

## Segurança e privacidade

- A sessão usa identificador aleatório opaco; somente seu hash é armazenado.
- O cookie é `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Login e demais requisições mutáveis validam uma origem confiável.
- O callback externo valida o double-submit cookie definido pelo Google antes de
  processar a credencial.
- O `form_post` real do Google pode chegar com origem opaca; a compatibilidade é
  limitada ao callback e ocorre após a prova CSRF, sem adicionar `null` às origens
  confiáveis globais.
- Nenhum token, cookie, conteúdo de documento ou dado pessoal é registrado em logs.
- O perfil retornado contém somente os atributos necessários à interface.

## Critérios de aceitação

- [x] Dada uma credencial Google válida, quando o login é solicitado, então o perfil
      local é criado ou atualizado e uma sessão é emitida.
- [x] Dada uma credencial inválida, quando o login é solicitado, então a resposta é
      `401` e nenhuma sessão é emitida.
- [x] Dado um e-mail não verificado, quando o login é solicitado, então a resposta é
      `403` e nenhuma sessão é emitida.
- [x] Dada uma sessão válida, quando `/auth/me` é consultado, então somente o perfil
      vinculado à sessão é retornado.
- [x] Dado um logout válido, quando a sessão é reutilizada, então o acesso é negado.
- [x] Dada uma execução de produção sem armazenamento persistente de sessões, quando
      a aplicação inicia, então a configuração é rejeitada.
- [x] Dado um callback com cookie e campo CSRF correspondentes, quando a credencial
      é válida, então a sessão é criada e o navegador retorna ao front-end.
- [x] Dado um callback sem prova CSRF válida, quando o login é solicitado, então a
      resposta é `403` e nenhuma sessão é criada.
- [x] Dada a página manual aberta incorretamente ou uma dependência sem resposta,
      quando a verificação inicial ocorre, então o estado deixa de ser `Verificando`
      e apresenta uma orientação acionável.

## Estratégia de teste

- Unitário: validação do ID token, mapeamento de claims, atualização do usuário e
  orquestração de login.
- Integração: emissão, leitura e revogação da sessão usando o armazenamento em memória.
- E2E: login, consulta do perfil, logout, credencial inválida e rota pública de saúde.

## Observabilidade

- Falhas de autenticação podem registrar apenas categoria do erro e identificador de
  correlação; nunca a credencial, cookie ou perfil completo.

## Questões em aberto

- O armazenamento PostgreSQL de usuários e sessões é especificado em
  [`FEAT-003`](postgres-persistence.md).

## Evidência de implementação

- Código: `src/auth/`, `src/users/`, `src/config/` e `src/bootstrap.ts`.
- Testes: `npm run lint`, `npm test` (12 testes), `npm run test:e2e` (10 testes) e
  `npm run build`, validados em 2026-11-18. O callback também foi exercitado na API
  Docker para redirecionamento seguro e rejeição de CSRF.
- Correção do cliente manual validada em 2026-11-19: abertura por `file://` apresenta
  o endereço correto; a página servida encerra a consulta de sessão e renderiza o
  botão Google; chamadas à API e carregamento do SDK possuem timeout de 10 segundos.
  Lint, build do Nest e do Vite, 40 testes unitários, 14 de integração e 19 E2E
  aprovados.
- Callback real reproduzido em 2026-11-19 com `Origin: null` e
  `Sec-Fetch-Site: cross-site`; o cenário foi incorporado aos testes E2E e de
  integração sem reduzir a rejeição de origem não confiável ou CSRF inválido.
- ADRs: [`ADR-0001`](../architecture/decisions/0001-google-id-token-and-server-session.md)
  e [`ADR-0003`](../architecture/decisions/0003-google-sign-in-redirect.md).
