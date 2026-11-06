import { createRestrictedSyntaxRule } from './restricted-syntax-rule.js';

export const noNewError = createRestrictedSyntaxRule({
  description: 'Forbids `new Error(...)` outside infrastructure: business errors are typed.',
  selectors: ["NewExpression[callee.name='Error']", "CallExpression[callee.name='Error']"],
  message:
    'Business errors are typed (`class RegistrationClosed extends DomainError`), never `new Error("...")`. ' +
    '`new Error(` is only allowed in infrastructure. See rules/code.md "Explicit, typed errors".',
});

export const noViMock = createRestrictedSyntaxRule({
  description: 'Forbids `vi.mock` outside infrastructure tests: use in-memory fakes.',
  selectors: ["CallExpression[callee.object.name='vi'][callee.property.name=/^(mock|doMock)$/]"],
  message:
    'Use an in-memory fake of the port (`InMemoryRegistrationRepository`) instead of `vi.mock`. ' +
    '`vi.mock` is only allowed for the outermost edge, in infrastructure. See rules/testing.md "Fakes instead of mocks".',
});

export const noInjectInView = createRestrictedSyntaxRule({
  description: 'Forbids `inject()` in a view (`*.view.ts`).',
  selectors: ["CallExpression[callee.name='inject']"],
  message:
    'A view is pure: it receives the view-model through `input()` and emits intents through `output()`. ' +
    'Inject services in the page (`*.page.ts`). See rules/mvvm.md.',
});

export const noConstructorDependenciesInView = createRestrictedSyntaxRule({
  description: 'Forbids constructors with parameters in a view (`*.view.ts`).',
  selectors: ["MethodDefinition[kind='constructor'][value.params.length>0]"],
  message:
    'A view has no dependencies: no constructor parameters. Dependencies live in the page (`*.page.ts`). ' +
    'See rules/mvvm.md.',
});

/** `.card`, `div.card`, `#list .card`, `ul > .card`: a CSS class anywhere in the selector. */
const cssClassSelectorPattern = String.raw`/(^|[\s>+~,(])[a-z0-9_-]*\.[A-Za-z_-]/`;

export const noCssClassLocator = createRestrictedSyntaxRule({
  description: 'Forbids CSS class selectors in Playwright `locator()`.',
  selectors: [
    `CallExpression[callee.property.name='locator'][arguments.0.value=${cssClassSelectorPattern}]`,
    `CallExpression[callee.property.name='locator'][arguments.0.quasis.0.value.raw=${cssClassSelectorPattern}]`,
  ],
  message:
    'Find elements by role and accessible text (`getByRole`, `getByLabel`), never by CSS class. See rules/e2e.md.',
});

export const noSystemClock = createRestrictedSyntaxRule({
  description: 'Forbids reading the system clock in domain and application code.',
  selectors: [
    "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    "NewExpression[callee.name='Date'][arguments.length=0]",
  ],
  message: 'The clock is a port: receive it (`Clock.now()`) instead of reading `Date`. See rules/architecture.md.',
});
