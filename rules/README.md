# Regras do ligeirinho

Regras super opinativas. Ninguém precisa pedir qualidade, segurança ou testes: elas valem sempre que o repositório
tem um `.ligeirinho.yml`.

Cada regra diz **por que existe** e **quem cobra**. Quem cobra é um destes quatro:

| Cobrador | Quando roda | Exemplo |
|---|---|---|
| **lint** | no editor, no `make test` e no gate | `@typescript-eslint` strict, `@angular-eslint`, Spectral, jscpd |
| **teste de arquitetura** | no `make test` e no gate | limites entre camadas com `@nx/enforce-module-boundaries` |
| **hook** | na hora, durante a sessão do Claude | barra `inject()` em view; roda testes antes do commit |
| **checklist** | o build aplica no diff antes de cada commit; o fechamento confere de novo | nomes, repetição por significado, comentário só para o porquê |

Regra sem cobrador não entra. Se uma regra só pode ser cobrada por checklist, ela fica no checklist até virar lint.

## Arquivos

1. [arquitetura.md](arquitetura.md) — camadas, módulos, um dono por padrão
2. [mvvm.md](mvvm.md) — view pura, view-model por função pura, página fina
3. [codigo.md](codigo.md) — nomes, tipos, erros, funções, comentários
4. [testes.md](testes.md) — teste antes, fakes, fixtures = cenários
5. [seguranca.md](seguranca.md) — zero trust, OWASP, auditoria
6. [escala.md](escala.md) — paginação, índices, N+1, idempotência, filas
7. [responsivo.md](responsivo.md) — mobile first, regras de layout, checagem no gate
8. [api-rest.md](api-rest.md) — contrato REST e as regras do Spectral
9. [e2e.md](e2e.md) — jornadas críticas com Playwright
10. [bruno.md](bruno.md) — coleção da API e drift check
11. [docs.md](docs.md) — doc da área, nota da feature, CLAUDE.md enxuto
12. [stack.md](stack.md) — stack fixa e Docker

## Projetos em adoção

Com `adocao: true` no `.ligeirinho.yml`, o que ainda não é cumprido entra como **aviso** em vez de erro. Os
avisos viram erro aos poucos, área por área. Código novo segue as regras inteiras desde o primeiro dia.
