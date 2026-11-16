# AGENTS.md

## Missão

O JusDigital é uma aplicação web de gestão e análise de documentos com Google
OAuth, AWS, OpenAI e persistência própria. O fluxo principal deve funcionar de
ponta a ponta antes da inclusão de diferenciais.

## Fontes de verdade

Antes de alterar comportamento, leia `docs/README.md` e siga o roteamento indicado
nele. As fontes canônicas são:

- Requisitos do produto: `docs/product/requirements.md`.
- Arquitetura e limites: `docs/architecture/`.
- Contrato HTTP: `docs/contracts/http-api.md`.
- Integrações externas: `docs/integrations/overview.md`.
- Segurança e testes: `docs/quality/`.
- Especificações de funcionalidades: `docs/features/`.

Não duplique regras entre documentos. Atualize a fonte canônica e crie links nos
demais arquivos.

## Fluxo orientado à documentação

1. Localize a especificação e os requisitos relacionados antes de implementar.
2. Se o comportamento ainda não estiver especificado, crie ou atualize uma feature
   spec usando `docs/templates/feature-spec.md`.
3. Registre decisões arquiteturais relevantes usando `docs/templates/adr.md`.
4. Implemente o menor incremento que satisfaça os critérios de aceitação.
5. Atualize código, testes e documentação na mesma mudança.
6. Não marque uma especificação como `implemented` sem evidência de verificação.

## Convenções técnicas

- Node.js 26 LTS, NestJS 12 e TypeScript em modo estrito.
- O projeto é ESM: imports relativos terminam em `.js`; não use `__dirname`.
- Testes usam Vitest (`vi`, não `jest`).
- Prefira módulos oficiais do NestJS quando atenderem ao caso de uso.
- Mantenha credenciais apenas em variáveis de ambiente do back-end.
- Nunca registre tokens, conteúdo integral de documentos ou dados pessoais em logs.
- Toda consulta a dados de usuário deve aplicar autorização por proprietário.
- Não adicione dependência de produção sem justificar a necessidade.

## Verificação mínima

Execute os comandos relevantes antes de concluir uma mudança:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

## Code Review Rules

- Aponte divergências entre código, feature specs, contratos e modelo de dados.
- Trate exposição de segredos, acesso entre usuários e upload inseguro como bloqueantes.
- Verifique erros e timeouts nas integrações Google, AWS e OpenAI.
- Exija testes para regras de negócio, autorização e estados de falha alterados.
- Não solicite alterações puramente estilísticas já cobertas por formatter ou linter.
