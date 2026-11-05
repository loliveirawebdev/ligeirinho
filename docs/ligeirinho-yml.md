# `.ligeirinho.yml`

O arquivo na raiz do repositório que diz "este projeto usa o ligeirinho". Sem ele, o plugin fica quieto.

YAML de **dois níveis** (seção e chave), sem listas aninhadas complexas, para os hooks lerem sem dependências.

```yaml
versao: 1

comandos:
  teste: make test            # rápido; roda antes de cada commit (toolbox de pé, docker compose exec)
  gate: make check            # só o afetado; o fechamento exige verde
  gate_completo: make gate    # tudo, container novo; CI e antes de release
  preview: make preview       # sobe o previewer em /__preview
  e2e: make e2e               # sob demanda

docs:
  areas: docs/areas
  features: docs/features

preview:
  url: http://localhost:4200/__preview
  larguras: 390,768,1280

adocao:
  ativa: false                # true em projeto existente: regra não cumprida no código antigo vira aviso
```

| Chave | Obrigatória | Quem usa |
|---|---|---|
| `comandos.teste` | sim | hook antes do commit |
| `comandos.gate` | sim | `scripts/gate.sh`, fechamento |
| `comandos.gate_completo` | não | `scripts/gate.sh completo` |
| `comandos.preview` | se tem front | skill de preview |
| `comandos.e2e` | não | sob demanda |
| `docs.areas`, `docs.features` | não (padrão `docs/areas`, `docs/features`) | skills, hook de fim de sessão |
| `preview.url`, `preview.larguras` | não (padrão acima) | skill de preview, `e2e-kit` |
| `adocao.ativa` | não (padrão `false`) | todas as regras |

Estado de trabalho (feature atual, etapa, carimbo de gate verde) fica em `.ligeirinho/`, fora do git.
