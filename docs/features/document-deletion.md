---
title: Exclusão de documentos próprios
status: accepted
last_updated: 2026-11-20
feature_id: FEAT-007
requirements:
  - DOC-004
  - DOC-005
  - SEC-002
---

# Exclusão de documentos próprios

## Problema

Permitir que uma pessoa autenticada remova um documento próprio, incluindo sua
referência persistida e o objeto privado correspondente, sem revelar ou alterar
recursos de outra pessoa.

## Escopo

### Incluído

- `DELETE /api/v1/documents/{id}` para exclusão de um documento por requisição.
- Autorização por `id` e proprietário derivado exclusivamente da sessão.
- Remoção do objeto no storage antes da referência no PostgreSQL.
- Seleção e exclusão de vários documentos no front-end por chamadas individuais.

### Não incluído

- Download do arquivo original.
- Endpoint de exclusão em lote ou recuperação de documentos excluídos.
- Fila de reconciliação para falhas raras entre storage e banco.

## Atores e autorização

- Somente a pessoa com sessão válida inicia a exclusão.
- A pessoa acessa apenas documentos cujo `userId` corresponde à sessão.

## Pré-condições

- Documento persistido com referência para um objeto privado no storage.

## Fluxo principal

1. O cliente confirma a exclusão e envia o ID do documento.
2. A API localiza o documento combinando ID e proprietário.
3. O serviço remove o objeto privado do storage.
4. O serviço remove a referência no banco e responde `204 No Content`.

## Regras de negócio

- `DELETE-RULE-001` - O `userId` vem somente da sessão e participa de todas as
  consultas e mutações.
- `DELETE-RULE-002` - Documento inexistente e documento de outro usuário produzem
  igualmente `404 DOCUMENT_NOT_FOUND`.
- `DELETE-RULE-003` - Falha no storage preserva o registro no banco e retorna erro
  seguro, permitindo uma nova tentativa.
- `DELETE-RULE-004` - O front-end exige confirmação explícita antes da exclusão.
- `DELETE-RULE-005` - Exclusão múltipla usa o contrato unitário e recarrega a lista
  quando uma chamada falha, evitando estado visual divergente.

## Estados e erros

| Situação                             | Comportamento esperado                | Código/estado                      |
| ------------------------------------ | ------------------------------------- | ---------------------------------- |
| Sessão ausente ou origem não aceita  | Rejeitar antes da exclusão            | `401` ou `403`                     |
| Documento próprio existente          | Remover storage e referência          | `204`                              |
| Documento inexistente ou de terceiro | Não confirmar existência              | `404 DOCUMENT_NOT_FOUND`           |
| Storage indisponível                 | Preservar referência e permitir retry | `503 EXTERNAL_SERVICE_UNAVAILABLE` |

## Contratos afetados

- API: [`../contracts/http-api.md`](../contracts/http-api.md).
- Dados: [`../architecture/data-model.md`](../architecture/data-model.md), sem nova
  migration.
- Integrações: [`../integrations/overview.md`](../integrations/overview.md).

## Segurança e privacidade

- A API nunca aceita `userId` do cliente nem expõe `storageKey`.
- Testes com dois usuários validam isolamento e resposta indistinguível.
- Logs não incluem nome, conteúdo, análise ou chave do objeto.

## Critérios de aceitação

- [ ] Dado um documento próprio, quando a exclusão é confirmada, então objeto e
      referência são removidos e a API responde `204`.
- [ ] Dado um documento de outro usuário ou inexistente, quando a exclusão é
      solicitada, então a API responde o mesmo `404` e não remove o objeto.
- [ ] Dada falha no storage, quando a exclusão é solicitada, então o registro
      permanece no banco e a API retorna erro seguro.
- [ ] Dados vários documentos selecionados, quando a pessoa confirma, então cada
      documento próprio é removido e a lista é atualizada.

## Estratégia de teste

- Unitário: ordem storage/banco, autorização e falha do storage.
- Integração: remoção owner-scoped no PostgreSQL.
- E2E: sucesso, sessão/origem, isolamento entre usuários e indisponibilidade.

## Observabilidade

- Registrar apenas categoria segura da falha externa e correlação da requisição.

## Questões em aberto

- Adicionar reconciliação assíncrona caso o banco falhe depois da remoção do objeto.

## Evidência de implementação

Preencher somente ao mudar o estado para `implemented`.

- Código: pendente.
- Testes: pendente.
- ADRs: [`ADR-0008`](../architecture/decisions/0008-document-deletion-order.md).
