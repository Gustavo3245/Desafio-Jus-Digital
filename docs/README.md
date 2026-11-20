---
title: Documentação do JusDigital
status: accepted
last_updated: 2026-11-16
---

# Documentação do JusDigital

Esta pasta contém as fontes de verdade funcionais e técnicas do projeto. Usamos o
termo **desenvolvimento orientado à documentação** por extenso para não confundir
esta prática com Domain-Driven Design, também conhecido como DDD.

## Ordem de leitura

1. [`product/requirements.md`](product/requirements.md) - escopo e critérios do desafio.
2. [`architecture/overview.md`](architecture/overview.md) - componentes e responsabilidades.
3. [`features/README.md`](features/README.md) - funcionalidades em desenvolvimento.
4. Documento especializado relacionado à tarefa.

## Mapa das fontes canônicas

| Assunto                       | Documento                                                                  |
| ----------------------------- | -------------------------------------------------------------------------- |
| Requisitos e escopo           | [`product/requirements.md`](product/requirements.md)                       |
| Arquitetura                   | [`architecture/overview.md`](architecture/overview.md)                     |
| Modelo de dados               | [`architecture/data-model.md`](architecture/data-model.md)                 |
| Decisões arquiteturais        | [`architecture/decisions/README.md`](architecture/decisions/README.md)     |
| Endpoints e payloads          | [`contracts/http-api.md`](contracts/http-api.md)                           |
| Google, AWS e OpenAI          | [`integrations/overview.md`](integrations/overview.md)                     |
| Segurança                     | [`quality/security.md`](quality/security.md)                               |
| Estratégia de testes          | [`quality/testing.md`](quality/testing.md)                                 |
| Qualidade e manutenção        | [`quality/code-quality.md`](quality/code-quality.md)                       |
| Processo com agentes e skills | [`workflow/agent-development.md`](workflow/agent-development.md)           |
| Catálogo de skills            | [`skills/README.md`](skills/README.md)                                     |
| Design do aplicativo          | [`skills/application-design/SKILL.md`](skills/application-design/SKILL.md) |
| Fundações visuais             | [`design/foundations.md`](design/foundations.md)                           |
| Telas de autenticação         | [`design/authentication.md`](design/authentication.md)                     |
| Tela de documentos            | [`design/documents.md`](design/documents.md)                               |
| Padrão editorial              | [`standards.md`](standards.md)                                             |

## Ciclo de uma funcionalidade

1. Criar a feature spec a partir de [`templates/feature-spec.md`](templates/feature-spec.md).
2. Revisar escopo, regras, erros e critérios de aceitação.
3. Registrar em ADR qualquer decisão arquitetural com impacto duradouro.
4. Implementar código e testes referenciando os IDs dos requisitos.
5. Atualizar contratos e documentos afetados na mesma mudança.
6. Marcar a spec como `implemented` somente após as verificações passarem.

## Estados permitidos

- `draft`: ainda pode mudar livremente.
- `accepted`: decisão ou contrato aprovado para implementação.
- `in_progress`: implementação em andamento.
- `implemented`: entregue e verificado.
- `deprecated`: mantido apenas como histórico.

O PDF do desafio é a fonte externa original. Estes documentos são a interpretação
operacional mantida pelo projeto; divergências devem ser resolvidas em favor do
desafio e registradas na documentação.
