---
title: Fundações visuais do JusDigital
status: accepted
last_updated: 2026-11-19
---

# Fundações visuais do JusDigital

## Direção

O produto adota uma interface suave, confiável e contemporânea, inspirada na clareza
e organização do Dropbox Dash sem copiar sua identidade. A experiência deve parecer
uma ferramenta de trabalho com documentos, não um sistema jurídico burocrático nem
um chat genérico com IA.

A direção foi aprovada durante a exploração de design registrada no
[chat de referência](https://chatgpt.com/s/cx_6aff1e5173d4819196ec14168d53c332).
O Figma original do desafio continua sendo a referência estrutural para sidebar,
documentos, upload e modal.

## Princípios

- Verde comunica confiança, navegação e ações operacionais.
- Violeta identifica inteligência artificial e conteúdo gerado.
- Bordas e diferenças de superfície separam regiões; sombras são discretas.
- Proximidade, alinhamento e região comum agrupam conteúdo relacionado.
- A mesma ação usa sempre o mesmo nome e tratamento visual.
- Fotografias e símbolos jurídicos genéricos não fazem parte da interface.

## Tokens semânticos

| Papel            | Valor     | Uso                                           |
| ---------------- | --------- | --------------------------------------------- |
| Ação primária    | `#0F7A55` | CTA, navegação ativa e foco operacional       |
| Primária forte   | `#075A40` | Hover e superfícies institucionais            |
| Primária suave   | `#E9F6F0` | Seleção, badges e fundos destacados           |
| IA               | `#5F3DC4` | Análise, processamento e conteúdo inteligente |
| IA suave         | `#F2EDFF` | Blocos e estados da IA                        |
| Texto principal  | `#252235` | Títulos e conteúdo                            |
| Texto secundário | `#6E6A7D` | Metadados e ajuda                             |
| Canvas           | `#F6F7F9` | Fundo geral                                   |
| Superfície       | `#FFFFFF` | Cards, modais e painéis                       |
| Borda            | `#DFE2E8` | Divisores e campos                            |
| Erro             | `#C43D4D` | Falhas, exclusão e ações destrutivas          |
| Alerta           | `#A35F00` | Limites, espera e atenção                     |

## Tipografia e geometria

- Família: Inter Variable, pesos 400, 500, 600 e 700, servida localmente.
- Corpo: mínimo de `1rem`; metadados nunca menores que `0.8125rem`.
- Espaçamento: escala baseada em 8 px, com meios passos de 4 px quando necessário.
- Raios: 8 px em campos, 10 px em botões e 14 px em cards ou painéis.
- Ícones: lineares, normalmente 20 px, com espessura consistente.
- Motion: 160 a 220 ms; remover transições não essenciais com
  `prefers-reduced-motion`.

## Estados obrigatórios

Controles interativos cobrem `default`, `hover`, `focus-visible`, `disabled`,
`loading` e erro quando aplicável. Alvos possuem pelo menos 44 px no mobile. Cor
nunca é o único indicador de estado.
