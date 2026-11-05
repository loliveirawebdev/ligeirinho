# Arquitetura

## Camadas fixas, dependência só para dentro

```
apresentação  →  aplicação  →  domínio
infraestrutura  →  aplicação (implementa as portas)
```

- **Domínio**: regra pura do negócio. Entidades, value objects, políticas. Sem IO, sem framework, sem Prisma,
  sem Nest, sem `Date.now()` direto (o relógio é uma porta).
- **Aplicação**: casos de uso e portas (interfaces que o caso de uso precisa: repositório, relógio, e-mail, fila).
- **Infraestrutura**: adaptadores que implementam as portas (Prisma, HTTP externo, fila, e-mail).
- **Apresentação**: HTTP (controllers, DTOs, guards) no back; páginas e views no front.

**Por quê:** regra de negócio testável sem banco nem rede, troca de infraestrutura sem tocar em regra, e um lugar
óbvio para cada coisa (o Claude e qualquer pessoa sabem onde procurar e onde escrever).

**Quem cobra:** teste de arquitetura com `@nx/enforce-module-boundaries`. Cada lib tem tags `layer:domain`,
`layer:application`, `layer:infrastructure`, `layer:presentation` e as dependências permitidas estão no
`eslint.config` do template. Import errado quebra o lint.

## Um módulo por área do negócio

No Nest, cada área do negócio (ex.: `inscricoes`, `modalidades`) é um módulo com as quatro camadas dentro. Uma
área não importa a infraestrutura de outra; conversa pela aplicação (caso de uso ou porta exposta) ou por evento.

**Por quê:** área com fronteira clara pode crescer, mudar de dono ou virar serviço sem cirurgia.

**Quem cobra:** tags `area:<nome>` no Nx + `@nx/enforce-module-boundaries`.

## Um dono por padrão (regra de dois)

Apareceu duas vezes, vira componente, função ou módulo com um dono só. Isso vale para código, para componente de
tela e para regra de negócio.

**Por quê:** duas cópias divergem. A terceira cópia já nasce com bug de uma delas.

**Quem cobra:** jscpd para cópia literal (todo ignore exige comentário com o motivo); checklist do fechamento
para **repetição por significado** (duas funções que fazem a mesma coisa com nomes e formas diferentes).

## Nada de `utils`, `helpers`, `manager`, `common`, `shared` genérico

Proibido como nome de arquivo, pasta, classe ou módulo, **a não ser** que o conteúdo seja realmente genérico (não
conhece nenhum conceito do negócio), more num lugar só e tenha nome explícito do que faz
(ex.: `libs/texto/normalizar-acentos.ts`, nunca `utils/string.ts`).

**Por quê:** `utils` vira gaveta de bagunça. Código de negócio escondido lá fica sem dono e é reescrito por quem
não acha.

**Quem cobra:** lint de nome de arquivo (`check-file` no template) + checklist.
