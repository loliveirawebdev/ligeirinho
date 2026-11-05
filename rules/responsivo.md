# Responsivo

## Regras de layout

| Regra | Por quê |
|---|---|
| **Mobile first**: estilo base é o celular; `min-width` adiciona | o celular é o caso mais difícil; começar por ele evita esconder coisa depois |
| **Layout fluido**: sem largura fixa em px para colunas; `max-width` só para texto (legibilidade) | largura fixa quebra entre os breakpoints |
| **Container queries** nos componentes | o componente se adapta ao espaço que tem, não à tela; funciona igual numa coluna lateral e na página inteira |
| **Breakpoints só dos tokens** do design system | três pontos de quebra conhecidos, não vinte |
| **Alvo de toque ≥ 44 px** | WCAG 2.5.5 e guias da Apple/Google |
| **Nada que dependa de hover** (menu, ação, informação) | celular não tem hover |
| **Tabela vira cartões no celular** por um componente do design system | tabela larga não cabe; um componente resolve para todas as telas |

**Quem cobra:** lint de estilo (stylelint: proíbe `width` em px fora de tokens, `@media` com valor que não é
token, `:hover` como único gatilho); checagem automática no gate (abaixo); checklist para o resto.

## Checagem no gate (propriedades, não imagem)

Para **cada cenário** de cada view, o Playwright abre o previewer em **390, 768 e 1280** e verifica:

1. sem rolagem horizontal (`scrollWidth <= clientWidth` no documento);
2. nenhum elemento clicável cortado ou fora da tela;
3. todo alvo clicável com pelo menos 44 × 44 px;
4. axe sem violação (acessibilidade).

Tela nova ganha essa checagem **só por ter cenários**: o teste lê a lista de cenários do previewer, ninguém
precisa escrever nada.

**Por quê:** comparação de imagem é frágil e precisa de alguém olhando. Propriedades pegam o que quebra de
verdade e rodam sozinhas.

**Quem cobra:** `e2e-kit` (pacote do ligeirinho) no gate.
