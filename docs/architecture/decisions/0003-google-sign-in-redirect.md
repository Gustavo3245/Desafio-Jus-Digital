---
title: ADR-0003 - Google Sign-In com redirecionamento na mesma aba
status: accepted
date: 2026-11-18
---

# ADR-0003 - Google Sign-In com redirecionamento na mesma aba

## Contexto

O fluxo inicial do Google Sign-In entrega o ID token a um callback JavaScript em
uma janela popup. A aplicação também precisa permitir autenticação na mesma aba,
sem substituir a sessão própria definida na ADR-0001 nem expor a credencial em URL.

No modo `redirect`, o Google Identity Services envia um formulário diretamente ao
back-end. Esse transporte possui requisitos diferentes do endpoint JSON existente:
o callback recebe `application/x-www-form-urlencoded` e inclui um token CSRF em
cookie e no corpo. Em navegador real, o `form_post` do Google pode serializar a
origem como `null`, mesmo com `Sec-Fetch-Site: cross-site`.

## Restrições e critérios

- Preservar o endpoint JSON para clientes que usem o modo popup.
- Reutilizar a validação do ID token e a criação de sessão existentes.
- Não enviar ID token, cookie ou dados pessoais em URLs ou logs.
- Aceitar o POST externo somente no callback dedicado.
- Retornar o navegador apenas para a origem configurada em `FRONTEND_URL`.

## Opções consideradas

### Opção A - Manter somente o popup

- Vantagens: não exige novo contrato HTTP e mantém o aplicativo visível.
- Desvantagens: abre uma janela secundária e pode limitar métodos de autenticação
  em navegadores incorporados.

### Opção B - Substituir o endpoint existente pelo callback de redirecionamento

- Vantagens: oferece um único fluxo de autenticação.
- Desvantagens: quebra clientes existentes e mistura respostas JSON com navegação.

### Opção C - Adicionar um callback de redirecionamento dedicado

- Vantagens: preserva compatibilidade, separa transportes e permite validar o CSRF
  específico do Google.
- Desvantagens: mantém dois pontos de entrada para a mesma regra de autenticação.

## Decisão

Adotamos a opção C. `POST /api/v1/auth/google` continua recebendo JSON para o modo
popup. `POST /api/v1/auth/google/callback` recebe o formulário do Google, exige que
o cookie e o campo `g_csrf_token` coincidam, valida a mesma credencial e cria a mesma
sessão opaca.

Depois da validação double-submit, o callback normaliza exclusivamente a combinação
real `Origin: null` e `Sec-Fetch-Site: cross-site` para a origem conhecida do Google,
permitindo que a proteção de login da biblioteca emita a sessão. `null` não é
adicionado às origens confiáveis globais; origem explícita não confiável e CSRF
inválido continuam bloqueados.

Após sucesso, o callback responde `303 See Other` para `/auth/callback` na origem
configurada. Falhas de credencial também retornam ao front-end com um código seguro;
falhas de CSRF são interrompidas com `403` e não redirecionam.

## Consequências

### Positivas

- O usuário pode concluir o Google Sign-In na mesma aba.
- O ID token continua sendo usado uma única vez e nunca aparece na URL.
- O front-end pode recuperar o perfil somente por `GET /auth/me` após o retorno.

### Negativas ou trade-offs

- A página do aplicativo deixa de ficar visível durante a autenticação no Google.
- A URI do callback precisa ser cadastrada exatamente no Google Cloud.
- O callback é uma exceção explícita à proteção de origem genérica e depende da
  validação double-submit do Google.
- A compatibilidade com origem opaca depende da ordem obrigatória: validar CSRF antes
  de normalizar o request usado na emissão da sessão.

## Plano de validação

- Teste E2E do callback real com `Origin: null`, `Sec-Fetch-Site: cross-site` e CSRF
  correspondente.
- Testes de rejeição para cookie ausente, divergente e credencial inválida.
- Teste real em navegador comum usando uma URI autorizada no Google Cloud.

## Substitui ou é substituída por

- Complementa a [`ADR-0001`](0001-google-id-token-and-server-session.md).
