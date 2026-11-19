---
title: Design das telas de autenticação
status: accepted
last_updated: 2026-11-19
---

# Design das telas de autenticação

## Referências canônicas

- Tokens e princípios: [`foundations.md`](foundations.md).
- Comportamento: [`../features/frontend-authentication.md`](../features/frontend-authentication.md).
- Contrato do back-end: [`../contracts/http-api.md`](../contracts/http-api.md).

## Login

### Conteúdo aprovado

- Marca: `JusDigital`.
- Título institucional: `Seus documentos, com respostas mais claras.`
- Apoio: `Envie, organize e analise documentos com IA em um ambiente privado e
simples de usar.`
- Título do acesso: `Boas-vindas`.
- Instrução: `Use sua conta Google para acessar seus documentos e análises.`
- Ação: botão oficial `Continuar com Google`.
- Privacidade: `O acesso aos arquivos é privado e associado à sua conta.`

### Composição

- Desktop: painel institucional verde profundo à esquerda e painel claro com card de
  acesso à direita. Uma ilustração abstrata de camadas de documentos ocupa o painel
  institucional sem competir com o título.
- Tablet: proporção dos painéis reduzida e card com largura fluida.
- Mobile: ocultar a ilustração ampla, preservar uma faixa curta de marca e centralizar
  o card de acesso. Nenhum conteúdo pode exigir rolagem horizontal em 320 px.

## Verificação e callback

- Exibir marca, indicador de atividade e uma mensagem específica para verificação de
  sessão ou conclusão do Google.
- Timeout e falha oferecem uma ação `Tentar novamente`.
- O código de erro técnico nunca é exibido diretamente.

## Conta e sessão

A tela protegida de configurações mantém a sidebar responsiva do aplicativo e agrupa:

1. Resumo com foto, nome, e-mail e identificação `Conta Google`.
2. Informações pessoais, com estado `Conectada` para o provedor.
3. Privacidade e acesso, alinhando ícone, título e descrição no mesmo eixo.
4. Sessão atual, com `Sair da conta` em tratamento destrutivo vermelho.

No mobile, a sidebar vira cabeçalho compacto; os cartões são empilhados e os rótulos
de dados passam para uma coluna quando necessário.
