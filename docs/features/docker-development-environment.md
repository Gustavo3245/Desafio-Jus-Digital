---
title: Ambiente Docker de desenvolvimento
status: implemented
last_updated: 2026-11-20
feature_id: FEAT-001
requirements:
  - DEV-001
  - DEV-002
  - DEV-003
---

# Ambiente Docker de desenvolvimento

## Problema

Fornecer um ambiente reproduzível para desenvolver e testar o front-end e o back-end
com a mesma versão de Node.js do projeto e uma instância PostgreSQL pronta para
conexões, sem depender de instalações locais além do Docker.

## Escopo

### Incluído

- Imagem do back-end com estágios de desenvolvimento, build e execução.
- Imagem de desenvolvimento do front-end com Vite e hot reload.
- Orquestração do front-end, API e PostgreSQL por Docker Compose.
- Sincronização automática das dependências do front-end quando seu lockfile mudar.
- Persistência dos dados locais do PostgreSQL em volume nomeado.
- Health checks do front-end, da API e do banco.
- Variáveis de ambiente locais com valores não secretos de desenvolvimento.
- Comandos documentados para subir, testar, inspecionar e remover o ambiente.

### Não incluído

- ORM, migrations, tabelas ou repositories PostgreSQL.
- Configuração de produção, CI/CD ou publicação em registry.
- Backup, alta disponibilidade ou observabilidade do banco.

## Atores e autorização

- Pessoas desenvolvedoras executam os serviços localmente.
- O PostgreSQL é exposto ao host apenas para ferramentas de desenvolvimento.
- Credenciais locais não podem ser reutilizadas em produção.

## Pré-condições

- Docker Engine com Docker Compose v2.

## Fluxo principal

1. A pessoa cria `.env` a partir de `.env.example` e preenche o Client ID Google.
2. Executa `docker compose up --build`.
3. O PostgreSQL inicializa e passa no health check.
4. A API inicia com hot reload e passa no health check HTTP.
5. O front-end sincroniza dependências alteradas, inicia o Vite e passa no health
   check HTTP.
6. Alterações em arquivos locais são refletidas nos containers de desenvolvimento.

## Regras de negócio

- `DEV-RULE-001` - Imagens base usam versões oficiais e explicitamente fixadas.
- `DEV-RULE-002` - O processo da aplicação na imagem final não executa como root.
- `DEV-RULE-003` - Dependências são instaladas com `npm ci` e `package-lock.json`.
- `DEV-RULE-004` - O serviço da API aguarda o PostgreSQL ficar saudável.
- `DEV-RULE-005` - Dados do banco sobrevivem à recriação de containers por volume.
- `DEV-RULE-006` - Nenhuma migration ou tabela é criada nesta entrega.
- `DEV-RULE-007` - Segredos reais não são adicionados às imagens ou ao repositório.
- `DEV-RULE-008` - O volume de dependências do front-end deve refletir o
  `package-lock.json` montado antes de iniciar o Vite.

## Estados e erros

| Situação                       | Comportamento esperado                                   | Código/estado   |
| ------------------------------ | -------------------------------------------------------- | --------------- |
| PostgreSQL ainda inicializando | API aguarda o health check                               | `starting`      |
| PostgreSQL indisponível        | API não é iniciada pelo Compose                          | `unhealthy`     |
| API disponível                 | Health check HTTP aprovado                               | `healthy`       |
| Lockfile do front-end alterado | Dependências do volume são reinstaladas com `npm ci`     | sincronização   |
| Variável Google ausente        | Valor local permite subir; login real exige configuração | desenvolvimento |

## Contratos afetados

- API: nenhum comportamento HTTP novo.
- Dados: [`../architecture/data-model.md`](../architecture/data-model.md), sem
  implementação de schema nesta entrega.
- Arquitetura:
  [`ADR-0002`](../architecture/decisions/0002-docker-development-environment.md).

## Segurança e privacidade

- A imagem final usa usuário sem privilégios.
- `.dockerignore` impede o envio de `.env`, Git, dependências e artefatos ao build.
- Credenciais padrão do PostgreSQL são exclusivas do ambiente local.
- O banco não deve ser publicado com essas credenciais em ambientes compartilhados.

## Critérios de aceitação

- [x] A imagem final do back-end é construída a partir de um checkout limpo.
- [x] `docker compose config` valida a composição sem avisos de sintaxe.
- [x] PostgreSQL fica saudável e preserva dados no volume nomeado.
- [x] A API fica saudável em `/api/v1/health` após o banco.
- [x] Testes e build podem ser executados no serviço da API.
- [x] Front-end inicia saudável e resolve dependências adicionadas ao lockfile sem
      recriar seu volume manualmente.
- [x] Nenhuma migration ou tabela da aplicação é criada.

## Estratégia de teste

- Estático: validar Dockerfile, Compose e configuração interpolada.
- Integração: construir a imagem e aguardar os dois health checks.
- Regressão: executar lint, testes e build existentes no container ou no host.

## Observabilidade

- Logs permanecem disponíveis por `docker compose logs`.
- Health checks distinguem disponibilidade do banco e da API.

## Questões em aberto

- A conexão efetiva da API ao PostgreSQL depende da escolha de ORM em `FEAT-003`.

## Evidência de implementação

- Código: `Dockerfile`, `frontend/Dockerfile`,
  `frontend/docker/development-entrypoint.sh`, arquivos `.dockerignore`,
  `compose.yaml`, `.env.example` e scripts `docker:*` em `package.json`.
- Testes: imagem `runtime` construída; usuário e conteúdo inspecionados;
  `docker compose config`; API e PostgreSQL saudáveis; endpoint de saúde aprovado;
  cluster PostgreSQL preservado após reinício; zero tabelas de aplicação; lint, build,
  7 testes unitários e 4 testes E2E aprovados dentro do container em 2026-11-18.
- Regressão de 2026-11-20: front-end saudável; lockfile divergente detectado;
  `react-markdown` e `remark-gfm` instalados no volume; componente transformado pelo
  Vite; 14 testes do front-end, 54 testes unitários e 21 testes E2E aprovados; builds
  do front-end e do back-end concluídos.
- ADRs: [`ADR-0002`](../architecture/decisions/0002-docker-development-environment.md).
