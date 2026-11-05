---
name: init
description: Prepara um repositório para usar o ligeirinho - cria .ligeirinho.yml, habilita o plugin no .claude/settings.json, enxuga o CLAUDE.md e cria docs/areas e docs/features. Use quando o Lucas pedir para adotar o ligeirinho num projeto (novo ou existente).
---

# Init

## Projeto existente (modo adoção)

1. Leia o Makefile, o `package.json` e o CLAUDE.md para achar os comandos de teste, gate e preview.
2. Crie o `.ligeirinho.yml` (formato em `docs/ligeirinho-yml.md` do plugin) com `adocao.ativa: true` e os
   comandos achados. Confirme os comandos com o Lucas.
3. Crie ou complete o `.claude/settings.json` do repo:
   ```json
   {
     "extraKnownMarketplaces": {
       "ligeirinho": { "source": { "source": "github", "repo": "loliveirawebdev/ligeirinho" } }
     },
     "enabledPlugins": { "ligeirinho@ligeirinho": true }
   }
   ```
   Preserve o que já existir no arquivo.
4. Crie `docs/areas/` e `docs/features/` (com um `README.md` curto em cada dizendo o que vai ali; ver
   `rules/docs.md`).
5. Proponha o CLAUDE.md enxuto (ver `rules/docs.md`): "este repo usa o ligeirinho", comandos, o que é
   específico. O que era regra de área vai para `docs/areas/<area>.md`. Mostre o antes/depois ao Lucas antes de
   substituir.
6. Adicione `.ligeirinho/` ao `.gitignore`.
7. Lint e configs dos pacotes do ligeirinho entram depois, área por área, com as regras não cumpridas como aviso.

## Projeto novo

O `template/` (Nx + Nest + Angular + Prisma + Vitest + Spartan, Docker, Makefile) ainda não existe. Por
enquanto, faça os passos 2 a 6 com `adocao.ativa: false` e avise o Lucas que o template é o próximo passo do
ligeirinho.
