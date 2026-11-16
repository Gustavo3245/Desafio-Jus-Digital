---
title: Segurança
status: accepted
last_updated: 2026-11-16
---

# Segurança

## Regras bloqueantes

- Chaves e tokens ficam somente no back-end e fora do repositório.
- Toda leitura, download e exclusão é autorizada pelo proprietário do documento.
- Não confie em extensão, nome ou MIME declarado pelo cliente isoladamente.
- Objetos S3 permanecem privados; acesso é temporário e posterior à autorização.
- Respostas HTTP não incluem stack traces ou mensagens externas sensíveis.
- Logs não incluem documento, token, cookie ou análise integral.

## Ameaças prioritárias

| Ameaça              | Controle mínimo                                                |
| ------------------- | -------------------------------------------------------------- |
| IDOR entre usuários | Consultar por recurso e proprietário; testar com dois usuários |
| Upload malicioso    | Allowlist, limite de tamanho, inspeção do tipo e nome seguro   |
| Roubo de sessão     | Cookie HttpOnly/Secure/SameSite e estratégia CSRF documentada  |
| Exposição do bucket | Bloqueio público e IAM mínimo                                  |
| Vazamento em logs   | Redação e logs estruturados sem payload sensível               |
| Abuso da OpenAI     | Limites, timeout e controle por usuário                        |
| Segredo no Git      | `.gitignore`, `.env.example` e revisão antes do commit         |

## Checklist de revisão

- Há caminho que aceita `userId` fornecido pelo cliente?
- Alguma resposta revela se um recurso de outro usuário existe?
- Arquivos temporários são removidos após sucesso e falha?
- Erros externos são sanitizados?
- Credenciais possuem o menor privilégio possível?
- Testes cobrem acesso cruzado e arquivos inválidos?
