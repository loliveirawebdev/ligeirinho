# Código

## Nomes significativos e explícitos

Nada de `x`, `data`, `tmp`, `res`, `item2`, `aux`, `obj`, `val`, `info`, abreviação (`usr`, `qtd`, `cfg`).
Nomes na língua do negócio: se o negócio fala "inscrição", o código fala `inscricao`, não `registration` num
lugar e `subscription` em outro.

Exceções: `i`/`j` em laço numérico de poucas linhas; `id` quando é o identificador da própria entidade.

**Por quê:** código é lido muito mais do que escrito. Nome bom elimina comentário e evita bug de confusão.

**Quem cobra:** lint (`id-denylist` com a lista acima, `@typescript-eslint/naming-convention`); checklist para
nome que não é da língua do negócio.

## Validação só na borda

Entrada externa (HTTP, fila, resposta de serviço externo, variável de ambiente) é validada **uma vez**, na borda,
e vira tipo do domínio. Dentro, os tipos garantem; nada de revalidar ou de `if (!x) throw` defensivo espalhado.

**Por quê:** validação espalhada é inconsistente e esconde onde o dado entra.

**Quem cobra:** checklist; DTOs com `class-validator` no Nest e `ValidationPipe` global com `whitelist` e
`forbidNonWhitelisted`.

## Tipagem estrita

`strict: true` e mais `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. Sem `any`, sem non-null `!`, sem
`as` de "confia em mim" (só `as const` e cast dentro de um type guard testado).

**Por quê:** o tipo é a documentação que o compilador confere.

**Quem cobra:** lint (`@typescript-eslint/strict-type-checked`, `no-explicit-any`, `no-non-null-assertion`,
`consistent-type-assertions` com `assertionStyle: never` fora de guards).

## Erro explícito e tipado, nunca engolido

Erros de negócio são tipos (`InscricaoEncerrada`, `VagaEsgotada`), não `throw new Error('...')` com string. Caso
de uso retorna resultado tipado ou lança erro tipado; a apresentação traduz para HTTP num lugar só. `catch` vazio
ou que só loga e segue é proibido.

**Por quê:** erro engolido vira bug silencioso; erro com string não dá para tratar nem testar direito.

**Quem cobra:** lint (`no-empty`, `@typescript-eslint/only-throw-error`, regra que proíbe `new Error(` fora da
infraestrutura); checklist para `catch` que esconde.

## Funções pequenas, retorno antecipado

- Uma função faz uma coisa. Se precisa de "e" no nome, são duas.
- Retorno antecipado em vez de `if` aninhado.
- **Booleano que muda comportamento vira duas funções** (`enviar(email, true)` → `enviarAgora` / `agendarEnvio`).

**Por quê:** função pequena tem nome que explica, teste simples e diff legível.

**Quem cobra:** lint (`max-lines-per-function: 40`, `max-depth: 2`, `complexity: 8`, `max-params: 3`);
checklist para parâmetro booleano.

## Comentário só para o porquê

O código diz o quê e como. Comentário existe para o porquê que não cabe no código (restrição externa, decisão
contraintuitiva, link para a fonte).

**Quem cobra:** checklist.

## Sem código morto, sem TODO solto

Nada comentado "para depois", nada sem uso, nada de `// TODO`. Ou vai para o backlog, ou não existe.

**Por quê:** código morto confunde quem lê e o Claude, que tenta mantê-lo funcionando.

**Quem cobra:** lint (`no-warning-comments`, `@typescript-eslint/no-unused-vars`); Nx/knip para exportação sem
uso no gate.
