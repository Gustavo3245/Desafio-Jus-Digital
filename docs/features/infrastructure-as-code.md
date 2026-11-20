---
title: Infraestrutura como Código (Terraform e Render Blueprint)
status: implemented
last_updated: 2026-11-20
feature_id: FEAT-011
requirements:
  - STO-001
  - STO-003
  - SEC-001
---

# Infraestrutura como Código (Terraform e Render Blueprint)

## Problema

Tornar o provisionamento da infraestrutura de armazenamento na AWS (S3 privado e IAM
de privilégio mínimo) e do serviço web da API (Render/Vercel) reproduzível, auditável
e declarativo no repositório, sem expor credenciais ou estados sensíveis.

## Escopo

### Incluído

- Manifesto Terraform (`infra/main.tf`) para provisionamento na AWS:
  - Bucket S3 de documentos (`aws_s3_bucket`);
  - Bloqueio integral de acesso público (`aws_s3_bucket_public_access_block`);
  - Controle de propriedade sem ACLs legadas (`BucketOwnerEnforced`);
  - Criptografia server-side padrão `AES256`;
  - Política IAM de privilégio mínimo restrita a `s3:PutObject`, `s3:GetObject` e
    `s3:DeleteObject` no prefixo `users/*` do bucket.
- Blueprint declarativo do Render (`render.yaml`) para o serviço `jusdigital-api`
  baseado no `Dockerfile` multi-stage, com health check em `/api/v1/health` e chaves
  sensíveis marcadas com `sync: false`.
- Configuração declarativa de proxy e SPA fallback para a Vercel (`frontend/vercel.json`).
- Exclusão de artefatos locais do Terraform (`.terraform/`, `*.tfstate*`, `*.tfvars`)
  no `.gitignore` e isolamento de `infra/` no `.dockerignore`.

### Não incluído

- Armazenamento de arquivos `.tfstate` ou chaves reais de nuvem no repositório.

## Atores e autorização

- Pessoas responsáveis pela infraestrutura executam `terraform init`, `terraform validate`
  e `terraform apply` com credenciais locais ou OIDC.
- A aplicação consome apenas a política IAM gerada, restrita ao prefixo `users/*`.

## Pré-condições

- Terraform `>= 1.5.0` para provisionamento AWS ou conta conectada ao Render/Vercel.

## Fluxo principal

1. A pessoa executa `terraform -chdir=infra init -backend=false` e `terraform -chdir=infra plan -var="bucket_name=<nome>"`.
2. O Terraform cria o bucket privado com `PublicAccessBlock`, criptografia `AES256` e
   política IAM restrita.
3. No Render, o `render.yaml` declara o container Docker da API com health check e
   variáveis obrigatórias sem valores secretos embutidos.
4. Na Vercel, `frontend/vercel.json` roteia `/api/v1/:path*` para a API e mantém as
   rotas SPA em `/index.html`.

## Regras de negócio

- `IAC-RULE-001` - O bucket S3 DEVE ter todas as quatro flags de `PublicAccessBlock`
  habilitadas (`STO-003`).
- `IAC-RULE-002` - A política IAM DEVE conceder apenas `s3:PutObject`, `s3:GetObject`
  e `s3:DeleteObject` em `${bucket_arn}/users/*`.
- `IAC-RULE-003` - Nenhum segredo, token ou arquivo `.tfstate` PODE ser versionado no
  repositório (`SEC-001`).

## Estados e erros

| Situação                            | Comportamento esperado                                         | Código/estado     |
| ----------------------------------- | -------------------------------------------------------------- | ----------------- |
| `bucket_name` com `arn:` ou `s3://` | Rejeitado pela regra `validation` do Terraform                 | erro de validação |
| Variável secreta no `render.yaml`   | Definida com `sync: false` para preenchimento seguro no painel | protegido         |
| Estado `.tfstate` local             | Ignorado pelo Git via `.gitignore`                             | não rastreado     |

## Contratos afetados

- Integrações: [`../integrations/overview.md`](../integrations/overview.md).

## Critérios de aceitação

- [x] `infra/main.tf` declara bucket S3 privado, bloqueio público, criptografia AES256
      e política IAM restrita a `users/*`.
- [x] `render.yaml` declara o serviço Docker da API com health check `/api/v1/health`
      e variáveis sensíveis com `sync: false`.
- [x] `frontend/vercel.json` declara o proxy `/api/v1/:path*` e fallback SPA.
- [x] `.gitignore` e `.dockerignore` protegem estados locais do Terraform e mantêm o
      contexto de build Docker enxuto.
