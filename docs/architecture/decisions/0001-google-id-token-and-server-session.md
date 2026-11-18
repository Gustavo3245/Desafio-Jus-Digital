---
title: ADR-0001 - Google ID token e sessão própria no servidor
status: accepted
date: 2026-11-18
---

# ADR-0001 - Google ID token e sessão própria no servidor

## Contexto

O front-end e o back-end podem evoluir em repositórios separados. A autenticação
precisa aproveitar Google Identity Services sem transformar a credencial do Google
em autorização permanente para a API. Também precisamos revogar sessões, reduzir a
exposição de tokens no navegador e preservar a possibilidade de múltiplas instâncias.

## Restrições e critérios

- Validar identidade no back-end conforme `AUTH-003`.
- Usar `sub` do Google como identificador externo estável.
- Não persistir nem registrar Google ID tokens.
- Manter credenciais e políticas de sessão somente no back-end.
- Usar componentes oficiais quando cobrirem o requisito.
- Permitir armazenamento persistente e compartilhado em produção.

## Opções consideradas

### Opção A - ID token no front-end e sessão opaca no back-end

- Vantagens: integra bem com Google Identity Services, não expõe um token de sessão
  legível pelo JavaScript e permite revogação no servidor.
- Desvantagens: exige armazenamento próprio de sessões e proteção de requisições
  baseadas em cookie.

### Opção B - Fluxo OIDC inteiro iniciado pelo back-end

- Vantagens: o back-end controla o redirecionamento e a troca de código.
- Desvantagens: aumenta o acoplamento entre URLs do front-end e do back-end e diverge
  do contrato já definido para `POST /auth/google`.

### Opção C - Usar o Google ID token como bearer token da aplicação

- Vantagens: dispensa armazenamento de sessões.
- Desvantagens: dificulta revogação local, envia repetidamente a credencial externa e
  mistura prova de identidade com autorização da aplicação.

## Decisão

Adotamos a opção A. O front-end obtém um Google ID token e o envia uma única vez a
`POST /api/v1/auth/google`. O back-end o verifica com `google-auth-library`, cria ou
atualiza o usuário identificado por `sub` e inicia uma sessão opaca com o módulo
oficial `@nestjs/authentication`.

Durante `FEAT-002`, usuários e sessões usam armazenamento em memória apenas para
desenvolvimento e testes. A inicialização em produção é rejeitada até `FEAT-003`
fornecer armazenamento PostgreSQL compartilhado para ambos.

## Consequências

### Positivas

- Tokens do Google não permanecem no cliente nem no armazenamento da aplicação.
- Sessões podem ser rotacionadas, revogadas e limitadas por inatividade.
- Guardas e decoradores de autenticação são centralizados.
- A futura separação dos repositórios não muda o contrato HTTP.

### Negativas ou trade-offs

- O cliente precisa enviar cookies com credenciais e usar uma origem confiável.
- Escala horizontal depende do armazenamento persistente planejado em `FEAT-003`.
- Ambientes que usem domínios totalmente distintos precisarão revisar `SameSite` e a
  proteção CSRF antes de produção.

## Plano de validação

- Testes unitários cobrem as claims obrigatórias e falhas da verificação Google.
- Testes E2E cobrem criação, uso e revogação da sessão.
- A configuração bloqueia produção enquanto o armazenamento for apenas em memória.

## Substitui ou é substituída por

- Nenhuma.
