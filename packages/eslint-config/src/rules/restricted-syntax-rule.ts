import type { Rule } from 'eslint';

interface RestrictedSyntax {
  readonly description: string;
  /** ESLint AST selectors (esquery) of the forbidden syntax. */
  readonly selectors: readonly string[];
  readonly message: string;
}

/**
 * Same idea as `no-restricted-syntax`, but one rule per concern: `no-restricted-syntax` is a single rule key, so
 * two configs touching the same file (base + angular view, base + tests) would overwrite each other's selectors.
 */
export function createRestrictedSyntaxRule(restrictedSyntax: RestrictedSyntax): Rule.RuleModule {
  return {
    meta: {
      type: 'problem',
      docs: { description: restrictedSyntax.description },
      schema: [],
      messages: { restricted: restrictedSyntax.message },
    },
    create(context) {
      const reportRestricted = (node: Rule.Node): void => {
        context.report({ node, messageId: 'restricted' });
      };
      return Object.fromEntries(restrictedSyntax.selectors.map((selector) => [selector, reportRestricted]));
    },
  };
}
