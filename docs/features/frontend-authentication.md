---
title: Front-end de autenticação e conta
status: implemented
last_updated: 2026-11-19
feature_id: FEAT-008
requirements:
  - AUTH-001
  - AUTH-002
  - AUTH-003
  - UX-001
  - UX-002
---

# Front-end de autenticação e conta

## Problema

Oferecer uma entrada real e responsiva para o JusDigital, fiel à linguagem visual do
Figma oficial, conectada à sessão segura do back-end e sem expor a credencial Google
ao JavaScript da aplicação depois do login.

## Escopo

### Incluído

- Aplicação React e TypeScript isolada em `frontend/` no mesmo repositório.
- Login com Google Identity Services usando redirect na mesma aba.
- Verificação inicial de sessão e conclusão do callback.
- Shell protegida provisória com perfil, estado vazio de documentos e logout.
- Estados de loading, configuração ausente, sessão expirada e falha recuperável.
- Layout responsivo em desktop, tablet, 390 px e limite de 320 px.
- Serviço Docker de desenvolvimento para o front-end.

### Não incluído

- Dashboard, listagem, upload ou análise de documentos.
- Edição de nome, e-mail ou foto fornecidos pelo Google.
- Login por senha ou outro provedor.

## Atores e autorização

- Pessoa sem sessão pode acessar somente a tela de login e o callback.
- Pessoa autenticada pode visualizar apenas o perfil derivado da própria sessão.

## Pré-condições

- API disponível e `FRONTEND_URL` apontando para a origem do Vite.
- Google OAuth Web Client autorizado para a origem e callback locais.

## Fluxo principal

1. O front-end consulta `GET /auth/me` com cookies.
2. Sem sessão, mostra a tela de login e inicializa o botão oficial do Google.
3. Google envia a credencial ao callback do back-end na mesma aba.
4. O back-end cria a sessão e retorna para `/auth/callback`.
5. O front-end confirma a sessão e abre a shell protegida de documentos.
6. Ao sair, envia `POST /auth/logout`, limpa o estado local e volta ao login.

## Regras de negócio

- `FRONT-AUTH-001` - O ID token não é persistido no navegador.
- `FRONT-AUTH-002` - Toda chamada de sessão usa `credentials: "include"`.
- `FRONT-AUTH-003` - Login usa redirect na mesma aba conforme ADR-0003.
- `FRONT-AUTH-004` - Uma falha encerra loading em tempo finito e oferece recuperação.
- `FRONT-AUTH-005` - Dados do perfil vêm somente de `/auth/me` ou da resposta de login.

## Estados e erros

| Situação                    | Comportamento esperado                    | Estado visual         |
| --------------------------- | ----------------------------------------- | --------------------- |
| Sessão válida               | Abrir shell protegida                     | Autenticado           |
| Sessão ausente ou expirada  | Exibir login                              | Não autenticado       |
| Google ainda carregando     | Bloquear ação e comunicar progresso       | Carregando            |
| Configuração Google ausente | Explicar correção sem botão quebrado      | Configuração inválida |
| API ou Google indisponível  | Encerrar espera e permitir nova tentativa | Erro recuperável      |
| Logout em andamento         | Desabilitar ação duplicada                | Saindo                |

## Contratos afetados

- API: [`../contracts/http-api.md`](../contracts/http-api.md), sem alteração.
- Dados: nenhum.
- Integrações: Google Identity Services pelo contrato já existente.
- Design: [`../design/authentication.md`](../design/authentication.md).

## Segurança e privacidade

- Não usar `localStorage` ou `sessionStorage` para credencial ou sessão.
- Não registrar perfil, credencial ou cookie.
- Não renderizar mensagens externas ou códigos técnicos sem tradução segura.
- Logout é apresentado como ação destrutiva, sem apagar documentos.

## Critérios de aceitação

- [x] Dada uma pessoa sem sessão, quando abre o aplicativo, então vê o login aprovado
      e consegue iniciar Google redirect na mesma aba.
- [x] Dado um callback válido, quando o front-end confirma a sessão, então exibe foto,
      nome e e-mail no perfil da shell protegida.
- [x] Dada uma sessão válida, quando a página é recarregada, então a conta permanece
      autenticada sem reutilizar o ID token.
- [x] Dado logout, quando a API confirma a revogação, então o aplicativo volta ao
      login e uma nova consulta protegida é rejeitada.
- [x] Dada falha de API, SDK ou configuração, então o loading termina e há orientação
      recuperável.
- [x] Dadas larguras desktop, 768 px, 390 px e 320 px, então não há corte ou overflow.

## Estratégia de teste

- Unitário: cliente HTTP, tradução de erros e utilitários do perfil.
- Integração: provider de autenticação com respostas controladas.
- E2E: contrato existente do back-end e validação manual com Google real.
- Visual: desktop e mobile com checklist de design.

## Observabilidade

- Erros do cliente podem registrar apenas categoria e endpoint, nunca payload pessoal.

## Questões em aberto

- A rota inicial autenticada será substituída pelo dashboard em sua feature própria.

## Evidência de implementação

- Código: aplicação React em `frontend/`, Google Identity Services em modo redirect,
  sessão via cookie, shell autenticada e serviço `frontend` no Compose.
- Testes: 7 testes unitários do front-end, 47 testes unitários do back-end, 14 de
  integração e 19 E2E aprovados; lint e builds dos dois pacotes aprovados em
  2026-11-19.
- Visual: comparação com o Figma oficial em desktop e validação responsiva em 390 px
  e 320 px, sem overflow horizontal.
- Docker: imagem do front-end construída e container saudável em `localhost:5173`.
