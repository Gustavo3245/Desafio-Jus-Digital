---
title: Fundações visuais do JusDigital
status: accepted
last_updated: 2026-11-19
---

# Fundações visuais do JusDigital

## Fonte canônica

O [Figma oficial do desafio](https://www.figma.com/design/fjtXfs1g7LmDqsUToHAohZ/Propostas?node-id=0-1)
é a fonte de verdade visual do produto. Decisões anteriores de redesign não devem ser
usadas na implementação enquanto a exigência de fidelidade ao protótipo permanecer.

O arquivo apresenta o fluxo de documentos, mas não possui uma tela de login pronta.
A autenticação deve, portanto, reutilizar a mesma linguagem visual sem inventar um
segundo sistema de design.

## Direção observada

- Sidebar verde sólida, sem gradientes ou efeitos decorativos.
- Conteúdo em superfícies brancas e cinza-claro.
- Ações primárias em verde e ações secundárias discretas.
- Tipografia sem serifa, compacta e funcional.
- Bordas finas, raios pequenos e sombras mínimas.
- Ícones lineares simples e alinhados com os rótulos.
- Hierarquia baseada em espaçamento e contraste, não em ilustrações.

## Tokens de implementação

Os valores abaixo reproduzem a aparência do protótipo público e centralizam eventuais
ajustes futuros quando houver inspeção de camada pelo Dev Mode.

| Papel            | Valor     | Uso                                      |
| ---------------- | --------- | ---------------------------------------- |
| Ação primária    | `#2FAA6F` | Sidebar, CTA e navegação ativa           |
| Primária forte   | `#268E5D` | Hover e foco de ações                    |
| Primária suave   | `#EDF8F2` | Estados vazios e fundos de ícones        |
| Texto principal  | `#262626` | Títulos e conteúdo                       |
| Texto secundário | `#6F6F73` | Descrições e metadados                   |
| Texto discreto   | `#909094` | Observações de baixa ênfase              |
| Canvas           | `#F7F7F8` | Fundo geral                              |
| Superfície       | `#FFFFFF` | Conteúdo, cards e painéis                |
| Borda            | `#DEDEE1` | Campos e divisores                       |
| Borda suave      | `#ECECEE` | Separadores internos                     |
| Erro             | `#B53A48` | Falhas de autenticação e ações inválidas |

## Tipografia e geometria

- Família: Inter Variable, servida localmente, com fallback para `system-ui`.
- Pesos principais: 400, 600 e 650.
- Espaçamento base: 8 px, admitindo passos de 4 px.
- Raios: 6 px em botões e navegação; 8 a 9 px em painéis.
- Sombras: apenas em painéis flutuantes, com baixa opacidade.
- Ícones: lineares, entre 17 e 20 px em controles.

## Estados obrigatórios

Controles interativos cobrem `default`, `hover`, `focus-visible`, `disabled`,
`loading` e erro quando aplicável. Alvos possuem pelo menos 44 px no mobile. Cor
nunca é o único indicador de estado.
