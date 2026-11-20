---
title: Design das telas de autenticação
status: accepted
last_updated: 2026-11-19
---

# Design das telas de autenticação

## Referências canônicas

- Baseline visual: [Figma oficial do desafio](https://www.figma.com/design/fjtXfs1g7LmDqsUToHAohZ/Propostas?node-id=0-1).
- Tokens e princípios: [`foundations.md`](foundations.md).
- Comportamento: [`../features/frontend-authentication.md`](../features/frontend-authentication.md).
- Contrato do back-end: [`../contracts/http-api.md`](../contracts/http-api.md).

## Login

Como o Figma não inclui um frame de autenticação, a tela estende diretamente a
linguagem do fluxo de documentos.

### Conteúdo

- Marca: `Jus Digital`.
- Mensagem lateral: `Documentos organizados e acessíveis.`
- Apoio: `Centralize seus arquivos e encontre as informações de que precisa.`
- Título: `Acesse sua conta`.
- Instrução: `Entre com sua conta Google para continuar.`
- Ação: botão oficial `Continuar com o Google`.
- Privacidade: `Seu acesso e seus documentos são privados.`

### Composição

- Desktop: duas regiões com exatamente 50% da largura disponível. A região verde
  agrupa marca, proposta de valor e garantia de segurança; a região clara centraliza
  o painel de autenticação e sua nota legal.
- Alinhamento e região comum definem os dois grupos principais; proximidade mantém
  título e apoio como uma unidade, enquanto espaço negativo separa a ação Google das
  informações secundárias.
- Não usar gradientes, ilustrações abstratas, cor violeta ou cards excessivamente
  arredondados, pois esses elementos não aparecem no baseline.
- Tablet e mobile: a região verde vira uma faixa horizontal que ocupa toda a parte
  superior; o título fica centralizado e integralmente contido nessa faixa. Marca,
  painel de acesso e nota legal permanecem centralizados abaixo dela, com largura
  fluida e limite legível a partir de 320 px.

## Verificação e callback

- Exibir a mesma marca e um painel branco compacto.
- Comunicar verificação de sessão e conclusão do callback separadamente.
- Timeout e falha oferecem `Tentar novamente` sem mostrar códigos técnicos.

## Destino autenticado provisório

Enquanto o módulo completo de documentos não é migrado para React, o login termina
em uma shell mínima baseada no Figma: sidebar verde, navegação `Documentos`, perfil
no rodapé e estado vazio no conteúdo. O botão de upload permanece desabilitado até a
feature correspondente ser implementada.
