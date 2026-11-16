# Checklist de revisão de design

Use somente as seções aplicáveis ao artefato revisado.

## Produto e fluxo

- [ ] A tela atende ao requisito e à feature spec relacionados.
- [ ] A ação primária é inequívoca e possui resultado observável.
- [ ] A interface não adiciona etapas desnecessárias ao fluxo obrigatório.
- [ ] Melhorias que divergem do Figma original estão identificadas e aprovadas.

## Hierarquia e consistência

- [ ] Título, conteúdo, ações e informações secundárias possuem ordem visual clara.
- [ ] Espaçamento, alinhamento e grid seguem uma lógica reutilizável.
- [ ] Cores e estilos usam papéis semânticos, não valores locais arbitrários.
- [ ] Componentes equivalentes mantêm aparência e comportamento equivalentes.
- [ ] Conteúdo realista foi usado para testar textos longos e dados ausentes.

## Componentes e estados

- [ ] Default, hover, focus, disabled e pressed foram considerados quando aplicáveis.
- [ ] Loading evita ações duplicadas e comunica progresso.
- [ ] Empty state explica o próximo passo.
- [ ] Erros orientam recuperação sem revelar detalhes internos.
- [ ] Confirmações destrutivas deixam claro o impacto.

## Acessibilidade

- [ ] Texto e controles possuem contraste suficiente.
- [ ] Foco é visível e a ordem de teclado acompanha a interface.
- [ ] Labels não dependem apenas de ícones, cor ou placeholder.
- [ ] Áreas interativas possuem tamanho adequado.
- [ ] Motion não é essencial para compreender o fluxo e respeita reduced motion.

## Responsividade

- [ ] A composição funciona no desktop exigido pelo desafio.
- [ ] Sidebar, grid, tabelas e modais possuem estratégia para telas menores.
- [ ] Não há corte, overflow ou ações inacessíveis com textos maiores.
- [ ] A prioridade do conteúdo é preservada ao reorganizar o layout.

## Verificação final

- [ ] O artefato foi aberto ou renderizado no formato real.
- [ ] Pelo menos um viewport desktop e um menor foram inspecionados.
- [ ] Limitações, placeholders e decisões pendentes estão registradas.
- [ ] Tokens ou componentes compartilhados alterados possuem documentação atualizada.
