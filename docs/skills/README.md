---
title: Catálogo de skills do projeto
status: accepted
last_updated: 2026-11-16
---

# Catálogo de skills

Esta pasta mantém skills documentadas junto ao restante das especificações. Ela não
é um local de descoberta automática do Codex.

## Skills disponíveis

| Skill                                               | Finalidade                                          | Estado               |
| --------------------------------------------------- | --------------------------------------------------- | -------------------- |
| [`application-design`](application-design/SKILL.md) | Planejar, melhorar e revisar o design do aplicativo | Pronta para ativação |

## Ativação no Codex

O Codex descobre skills de repositório em `.agents/skills/`. Para manter a fonte em
`docs/skills/`, crie um link simbólico a partir da pasta descoberta:

```bash
mkdir -p .agents/skills
ln -s ../../docs/skills/application-design .agents/skills/application-design
```

Como alternativa, mova a pasta inteira para `.agents/skills/`. Não mantenha duas
cópias independentes, pois elas podem divergir.

Depois de ativada, invoque explicitamente com `$application-design` ou permita a
seleção implícita pela descrição da skill.
