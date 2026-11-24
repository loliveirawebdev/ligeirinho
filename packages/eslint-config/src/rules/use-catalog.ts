import type { Rule } from 'eslint';
import { classTokens, hasAttribute, isTemplateElement, type TemplateElement } from './template-ast.js';

/**
 * Markup the project's catalog (libs/ui) already builds. Each pattern names one way to recognize the hand-built
 * version (an element, an attribute or a class) and the catalog component to use instead.
 */
export interface CatalogPattern {
  readonly element?: string;
  readonly attribute?: string;
  readonly className?: string;
  /** The catalog component, e.g. `ui-data-table`. */
  readonly use: string;
}

function matches(element: TemplateElement, pattern: CatalogPattern): boolean {
  const checks = [
    pattern.element === undefined || element.name === pattern.element,
    pattern.attribute === undefined || hasAttribute(element, [pattern.attribute]),
    pattern.className === undefined || classTokens(element).includes(pattern.className),
  ];
  const hasCriteria = [pattern.element, pattern.attribute, pattern.className].some((criterion) => criterion !== undefined);
  return hasCriteria && checks.every(Boolean);
}

function describe(pattern: CatalogPattern): string {
  if (pattern.element !== undefined) {
    return `<${pattern.element}>`;
  }
  return pattern.attribute === undefined ? `class "${pattern.className ?? ''}"` : `the ${pattern.attribute} attribute`;
}

interface UseCatalogOptions {
  readonly patterns?: readonly CatalogPattern[];
}

function isOptions(ruleOptions: unknown): ruleOptions is UseCatalogOptions {
  return typeof ruleOptions === 'object' && ruleOptions !== null;
}

/** rules/design.md "Reuse first": screens compose the catalog; they don't rebuild what it has. */
export const useCatalog: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbids hand-building markup the project catalog already provides.' },
    schema: [
      {
        type: 'object',
        properties: {
          patterns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                element: { type: 'string' },
                attribute: { type: 'string' },
                className: { type: 'string' },
                use: { type: 'string' },
              },
              required: ['use'],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useCatalog:
        '{{found}} is hand-built here, but the catalog has it: use `<{{use}}>` (libs/ui/README.md). The catalog ' +
        'solves its layout, states and accessibility once. If it doesn’t fit, change the catalog, not the screen. ' +
        'See rules/design.md "Reuse first".',
    },
  },
  create(context) {
    const [firstOption] = context.options;
    const patterns = (isOptions(firstOption) ? firstOption.patterns : undefined) ?? [];
    return {
      Element(node: unknown) {
        if (!isTemplateElement(node)) {
          return;
        }
        const pattern = patterns.find((candidate) => matches(node, candidate));
        if (pattern !== undefined) {
          // eslint-disable-next-line id-denylist -- `data` is the name ESLint's report API requires.
          context.report({ loc: node.loc, messageId: 'useCatalog', data: { found: describe(pattern), use: pattern.use } });
        }
      },
    };
  },
};
