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

- Referência de composição aprovada: imagem de login fornecida em 2026-11-19. A
  referência orienta somente estrutura, hierarquia e organização; ilustração,
  marca, textos e identidade visual não são copiados.
- Desktop: o canvas neutro centraliza um único painel branco de grande raio. Dentro
  dele, a região verde ligeiramente mais larga apresenta a proposta de valor e uma
  composição original de documentos; a região clara reúne marca, autenticação e
  nota legal sem criar um segundo card visual.
- Região comum conecta as duas áreas como uma experiência única; proximidade agrupa
  título, apoio e representação de documentos; alinhamento central organiza o acesso;
  espaço negativo separa a ação Google das informações secundárias.
- Não usar gradientes, ilustrações abstratas ou cor violeta. O grande raio fica
  reservado ao painel unificado e à região visual; controles mantêm os raios do
  sistema para não descaracterizar o baseline.
- Tela dividida e tablet: em larguras de até 1080 px, o painel passa para uma coluna
  para garantir largura útil ao acesso. A região verde preserva título, apoio, visual
  de documentos e garantia de segurança antes da área de autenticação.
- Mobile: o painel ocupa toda a largura, a região verde vira um cabeçalho horizontal
  compacto e o visual de documentos é simplificado. Marca, autenticação e nota legal
  permanecem centralizadas abaixo dele, com largura fluida a partir de 320 px.
- Marca, textos, botão Google, privacidade e nota legal compartilham o mesmo limite de
  largura e nunca podem ultrapassar a região clara. O componente injetado pelo Google
  deve usar a largura observada do contêiner, sem impor um mínimo maior que ele.

### Evolução aprovada

- Preservar: cores, tipografia, textos obrigatórios, botão oficial Google, privacidade
  e estados de falha/carregamento.
- Melhorar: hierarquia, respiro, unidade do painel e separação entre a proposta de
  valor e a tarefa de autenticação.
- Adicionar: representação original e decorativa de documento, busca e proteção,
  sem introduzir novas promessas funcionais.

## Verificação e callback

- Exibir a mesma marca e um painel branco compacto.
- Comunicar verificação de sessão e conclusão do callback separadamente.
- Timeout e falha oferecem `Tentar novamente` sem mostrar códigos técnicos.

## Destino autenticado provisório

Enquanto o módulo completo de documentos não é migrado para React, o login termina
em uma shell mínima baseada no Figma: sidebar verde, navegação `Documentos`, perfil
no rodapé e estado vazio no conteúdo. O botão de upload permanece desabilitado até a
feature correspondente ser implementada.
