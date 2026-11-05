# E2E

## Só jornadas críticas, de ponta a ponta de verdade

E2E cobre as jornadas que, se quebrarem, o produto para: login, convite e aceite, criar e ver na lista, permissão
negada, pagamento… Front, API e banco reais, **sem mock**.

**Por quê:** e2e é caro e lento. O resto já está coberto por unidade, componente e integração.

**Quem cobra:** o plano lista as jornadas tocadas; **jornada crítica nova sem e2e não fecha** (checklist do
fechamento).

## Como escrever

| Regra | Por quê |
|---|---|
| Elementos por papel e texto acessível (`getByRole`, `getByLabel`), **nunca por classe CSS** | testa o que o usuário vê; de quebra cobra acessibilidade |
| **Sem `sleep`** / `waitForTimeout`; esperar por estado (`expect(...).toBeVisible()`) | sleep é lento e instável ao mesmo tempo |
| **Cada teste cria os próprios dados** (pelas fábricas/seed) | testes rodam em paralelo e em qualquer ordem |
| Trace guardado quando falha | dá para ver o que aconteceu sem rodar de novo |
| Mesma seed do Bruno e do previewer | um dado de exemplo só (ver [testes.md](testes.md)) |

**Quem cobra:** lint do Playwright (`eslint-plugin-playwright`: `no-wait-for-timeout`, `prefer-native-locators`,
regra que proíbe `locator('.classe')`); config do `e2e-kit` com `trace: 'retain-on-failure'`.

## Onde roda

Stack inteira em Docker com banco limpo:

- `make check` → jornadas afetadas pela mudança;
- gate completo e CI → todas;
- `make e2e` → sob demanda.
