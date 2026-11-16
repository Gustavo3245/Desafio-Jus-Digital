---
title: <Nome da funcionalidade>
status: draft
last_updated: <YYYY-MM-DD>
feature_id: <FEAT-000>
requirements:
  - <REQ-000>
---

# <Nome da funcionalidade>

## Problema

<Explique o problema e o resultado esperado sem prescrever implementação.>

## Escopo

### Incluído

- <Comportamento incluído.>

### Não incluído

- <Limite explícito desta entrega.>

## Atores e autorização

- <Quem inicia o fluxo?>
- <Quais recursos essa pessoa pode acessar?>

## Pré-condições

- <Estado necessário antes do fluxo.>

## Fluxo principal

1. <Ação ou evento.>
2. <Resposta do sistema.>

## Regras de negócio

- `RULE-001` - <Regra verificável.>

## Estados e erros

| Situação   | Comportamento esperado | Código/estado |
| ---------- | ---------------------- | ------------- |
| <Situação> | <Resultado seguro>     | <Código>      |

## Contratos afetados

- API: <link ou "nenhum">.
- Dados: <link ou "nenhum">.
- Integrações: <link ou "nenhuma">.

## Segurança e privacidade

- <Autorização, dados pessoais, segredos, upload ou logs afetados.>

## Critérios de aceitação

- [ ] Dado <contexto>, quando <ação>, então <resultado observável>.
- [ ] <Caminho de erro ou autorização relevante.>

## Estratégia de teste

- Unitário: <casos>.
- Integração: <casos>.
- E2E: <casos>.

## Observabilidade

- <Logs ou métricas necessários, sem dados sensíveis.>

## Questões em aberto

- <Pergunta que precisa de decisão; remover quando resolvida.>

## Evidência de implementação

Preencher somente ao mudar o estado para `implemented`.

- Código: <links/caminhos>.
- Testes: <comandos e resultado>.
- ADRs: <links ou "nenhuma">.
