---
name: application-design
description: Planeja, melhora e revisa o design de produto do JusDigital a partir do Figma, dos requisitos e dos fluxos existentes. Use ao redesenhar telas, definir direção visual, tokens, componentes, estados ou um brief pronto para implementação; não use para tarefas exclusivas de back-end ou peças de marketing sem relação com o aplicativo.
---

# Application Design

Crie uma evolução original do produto sem perder o fluxo obrigatório nem os pontos
de avaliação do desafio. Trate o Figma fornecido como baseline a ser auditada: não o
copie cegamente e não se afaste dele silenciosamente.

## Fontes e prioridades

1. Leia `docs/product/requirements.md` e a feature spec relacionada.
2. Inspecione o Figma e os assets fornecidos antes de propor alterações visuais.
3. Consulte `docs/quality/security.md` para estados ou fluxos com dados sensíveis.
4. Preserve textos e comportamentos obrigatórios; destaque melhorias que alterem a
   proposta oficial para aprovação do usuário.

Separe a análise em três grupos:

- **Preservar:** elementos exigidos ou já resolvidos adequadamente.
- **Melhorar:** hierarquia, clareza, acessibilidade, responsividade ou consistência.
- **Adicionar:** estados e componentes ausentes necessários para uma experiência completa.

## Processo

### 1. Formar a direção

Use [references/design-brief.md](references/design-brief.md) quando o objetivo,
público, restrições ou sentimento visual ainda não estiverem claros. Não escolha
cores ou estilos antes de compreender o fluxo e a prioridade da tela.

### 2. Propor antes de implementar

Apresente uma proposta curta contendo:

- princípios visuais e de interação;
- arquitetura de informação e hierarquia da tela;
- papéis semânticos de cor, tipografia, espaçamento, raio e elevação;
- inventário de componentes, variantes e estados;
- comportamento responsivo e de teclado;
- plano de arquivos e riscos de fidelidade ao protótipo.

Solicite aprovação antes de mudanças materiais na direção visual, no fluxo ou nos
tokens compartilhados. Ajustes locais claramente pedidos pelo usuário podem seguir
sem um checkpoint extra.

### 3. Implementar um sistema, não uma tela isolada

- Use tokens semânticos em vez de valores arbitrários repetidos.
- Reutilize componentes antes de criar variações locais.
- Cubra estados default, hover, focus, disabled, loading, empty, success e error
  quando aplicáveis.
- Preserve fonte editável e documente decisões reutilizáveis.
- Ao trabalhar diretamente no Figma, use as ferramentas e skills Figma disponíveis
  no ambiente e mantenha os componentes vinculados aos tokens do sistema.

### 4. Verificar

Leia [references/design-review-checklist.md](references/design-review-checklist.md)
antes de concluir uma tela ou fluxo. Faça revisão visual em desktop e em pelo menos
um viewport menor, além dos testes de interação disponíveis.

## Limites

- Não copie logos, ilustrações, textos ou identidade distintiva de referências.
- Não invente depoimentos, resultados, dados jurídicos ou alegações de produto.
- Não sacrifique contraste, foco visível ou legibilidade por estética.
- Não altere tokens aprovados silenciosamente durante uma tarefa de tela.
- Não marque o design como pronto sem verificar estados de erro e carregamento.
- Não implemente uma expansão de escopo apenas porque ela melhoraria o mockup.

## Resultado esperado

Entregue o artefato pedido e registre, conforme o escopo:

- o que foi preservado, melhorado e adicionado;
- decisões de design e tokens afetados;
- componentes e estados cobertos;
- verificações realizadas;
- divergências aprovadas em relação ao Figma original;
- limitações e próximos passos.

Esta skill foi criada como adaptação original para o JusDigital, inspirada no
workflow público [Codex Design Studio](https://aitooltip.com/codex-design). Nenhum
arquivo do pacote original foi incorporado, pois o download não apresenta licença.
