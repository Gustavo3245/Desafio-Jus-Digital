---
title: Segurança
status: accepted
last_updated: 2026-11-18
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

## Controles de autenticação implementados

- Google ID tokens são validados no back-end para assinatura, emissor, audiência e
  expiração; `sub` é a identidade externa canônica.
- A credencial Google não é persistida e não aparece em logs.
- Sessões usam tokens opacos aleatórios, armazenados somente como hash.
- Cookies são `HttpOnly`, `SameSite=Lax`, `Path=/` e `Secure` em produção.
- O guard global protege rotas por padrão e exige marcação explícita para acesso
  público.
- Proteção de origem do NestJS cobre login CSRF e requisições mutáveis; CORS não é
  tratado como substituto dessa proteção.
- O callback de Google redirect é a única exceção de rota e exige a igualdade entre
  o cookie e o campo `g_csrf_token` antes de validar a credencial.
- A aplicação recusa produção com armazenamento de sessão em memória.
- A chave da OpenAI é validada na inicialização, permanece no back-end e nunca é
  incluída em respostas ou logs.
- A análise usa `store: false`; arquivo, instrução, resposta e detalhes do erro
  externo não são registrados.
- O conteúdo do documento é tratado como dado não confiável e não como instrução
  para o modelo.

## Checklist de revisão

- Há caminho que aceita `userId` fornecido pelo cliente?
- Alguma resposta revela se um recurso de outro usuário existe?
- Arquivos temporários são removidos após sucesso e falha?
- Erros externos são sanitizados?
- Credenciais possuem o menor privilégio possível?
- Testes cobrem acesso cruzado e arquivos inválidos?
