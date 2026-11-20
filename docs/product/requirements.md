---
title: Requisitos do produto
status: accepted
last_updated: 2026-11-20
---

# Requisitos do produto

## Objetivo

Permitir que uma pessoa autenticada envie documentos, forneça uma instrução e
receba uma análise gerada por IA, mantendo histórico e controle sobre seus próprios
documentos.

## Fluxo principal

1. Entrar com Google OAuth.
2. Exibir foto, nome e e-mail obtidos do Google.
3. Anexar um documento, informar título e instrução.
4. Enviar documento e instrução ao `gpt-4o-mini` pelo back-end.
5. Armazenar o original na AWS e os metadados em banco separado.
6. Listar documentos, abrir a análise e excluir um documento.

## Requisitos funcionais

### Autenticação

- `AUTH-001` - O usuário DEVE conseguir entrar usando Google OAuth.
- `AUTH-002` - O sistema DEVE exibir foto, nome e e-mail retornados pelo Google.
- `AUTH-003` - O back-end DEVE validar a identidade recebida antes de criar uma sessão.

### Documentos

- `DOC-001` - O usuário autenticado DEVE conseguir enviar arquivo, título e instrução.
- `DOC-002` - O usuário DEVE conseguir listar somente seus próprios documentos.
- `DOC-003` - O usuário DEVE conseguir abrir a análise de um documento próprio.
- `DOC-004` - O usuário DEVE conseguir excluir um documento próprio.
- `DOC-005` - Download e exclusão DEVEM validar a propriedade do documento.

### Inteligência artificial

- `AI-001` - Ao salvar, o back-end DEVE enviar documento e instrução ao `gpt-4o-mini`.
- `AI-002` - O resultado da análise DEVE ser persistido e associado ao documento.
- `AI-003` - Falhas, timeout ou limite da OpenAI NÃO DEVEM produzir um documento falsamente concluído.

### Armazenamento

- `STO-001` - O arquivo original DEVE ser armazenado em serviço AWS.
- `STO-002` - Título, instrução, análise e referência do arquivo DEVEM ficar no banco de dados.
- `STO-003` - O arquivo original NÃO DEVE ficar público por padrão.

## Requisitos de qualidade

- `SEC-001` - Chaves e tokens DEVEM existir somente no back-end e fora do repositório.
- `SEC-002` - Dados de usuários diferentes DEVEM permanecer isolados.
- `UX-001` - A interface desktop DEVE ser fiel ao protótipo.
- `UX-002` - A experiência DEVERIA incluir loading e feedback de sucesso ou erro.

## Diferenciais priorizados

1. Validação e feedback de upload.
2. Responsividade e drag and drop.
3. Retry controlado para integrações.
4. Testes, Docker, CI, infraestrutura como código e deploy.

## Fora do escopo inicial

- Compartilhamento de documentos entre usuários.
- Edição colaborativa ou versionamento de arquivos.
- Treinamento de modelo próprio.
- Microsserviços, filas distribuídas ou processamento massivo.

## Questões em aberto

- Tipos e tamanho máximo aceitos.
- Formato final da resposta da IA.
- Hospedagem do banco e do back-end.
