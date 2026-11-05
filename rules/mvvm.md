# Front em MVVM de verdade

Três peças por tela, cada uma num arquivo com sufixo fixo:

| Peça | Arquivo | Pode | Não pode |
|---|---|---|---|
| **View** | `*.view.ts` (+ `.html`) | receber o view-model por `input()`, emitir intenções por `output()`, usar componentes do design system | `inject()`, construtor com dependência, buscar dado, conhecer rota, conhecer HTTP |
| **View-model** | `*.view-model.ts` | função pura `montarXxxViewModel(estado) → XxxViewModel` | IO, Angular, signals, efeitos |
| **Página** | `*.page.ts` | injetar serviços, buscar dado, guardar estado em signals, montar o view-model com `computed()`, ligar outputs a ações | regra de apresentação (ela fica no view-model) |

Mais um arquivo ao lado da view: `*.scenarios.ts` com os cenários (vazia, cheia, erro, só leitura…), cada um um
view-model de exemplo. Os cenários são as fixtures dos testes e do previewer (ver [testes.md](testes.md)).

**Por quê:**
- View pura renderiza no previewer com qualquer cenário, sem mock de serviço.
- View-model por função pura é testado com uma linha por caso, sem TestBed.
- Página fina tem pouca coisa para dar errado e o teste dela é só de ligação.

**Quem cobra:**
- **hook** do plugin: barra `inject(` e construtor com parâmetros em `*.view.ts` na hora da escrita.
- **lint**: regra no `@angular-eslint`/`no-restricted-syntax` do template para o mesmo caso em `*.view.ts`;
  `no-restricted-imports` impede `*.view-model.ts` de importar `@angular/*`.
- **checklist**: regra de apresentação (formatar data, decidir se botão aparece) dentro da página ou da view.

## Elementos crus só no design system

Fora da biblioteca de componentes (Spartan + componentes do projeto) é proibido usar `<button>`, `<input>`,
`<select>`, `<textarea>`, `<table>`, `<dialog>` crus no template.

**Por quê:** acessibilidade, estados (foco, desabilitado, carregando) e responsivo resolvidos uma vez.

**Quem cobra:** lint de template (`@angular-eslint/template` com regra de elementos proibidos).

## Signals

`input()` / `output()` / `computed()` / `signal()`. Nada de `@Input()` decorator, `EventEmitter` manual ou
`BehaviorSubject` para estado de tela.

**Por quê:** um modelo de reatividade só, com detecção de mudança previsível.

**Quem cobra:** lint (`@angular-eslint/prefer-signals`, `prefer-output-readonly`).
