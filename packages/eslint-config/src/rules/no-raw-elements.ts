import type { AST, Rule } from 'eslint';

export const defaultRawElements: readonly string[] = ['button', 'input', 'select', 'textarea', 'table', 'dialog'];

interface TemplatePosition {
  readonly line: number;
  readonly col: number;
}

/** The part of an `@angular-eslint/template-parser` `Element` node this rule reads. */
interface TemplateElement {
  readonly name: string;
  readonly startSourceSpan: { readonly start: TemplatePosition; readonly end: TemplatePosition };
}

interface NoRawElementsOptions {
  readonly elements: readonly string[];
}

function isTemplateElement(node: unknown): node is TemplateElement {
  return (
    typeof node === 'object' &&
    node !== null &&
    'name' in node &&
    typeof node.name === 'string' &&
    'startSourceSpan' in node &&
    typeof node.startSourceSpan === 'object'
  );
}

function isNoRawElementsOptions(ruleOptions: unknown): ruleOptions is NoRawElementsOptions {
  return (
    typeof ruleOptions === 'object' &&
    ruleOptions !== null &&
    'elements' in ruleOptions &&
    Array.isArray(ruleOptions.elements)
  );
}

function readForbiddenElements(ruleOptions: readonly unknown[]): readonly string[] {
  const [firstOption] = ruleOptions;
  return isNoRawElementsOptions(firstOption) ? firstOption.elements : defaultRawElements;
}

/** Angular source spans are 0-based lines; ESLint locations are 1-based lines. */
function toLocation(element: TemplateElement): AST.SourceLocation {
  const { start, end } = element.startSourceSpan;
  return {
    start: { line: start.line + 1, column: start.col },
    end: { line: end.line + 1, column: end.col },
  };
}

export const noRawElements: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbids raw interactive HTML elements outside the design system.' },
    schema: [
      {
        type: 'object',
        properties: { elements: { type: 'array', items: { type: 'string' } } },
        additionalProperties: false,
      },
    ],
    messages: {
      rawElement:
        'Raw <{{element}}> is only allowed inside the design system. Use the design system component, which ' +
        'solves accessibility, states and responsiveness once. See rules/mvvm.md "Raw elements only in the design system".',
    },
  },
  create(context) {
    const forbiddenElements = readForbiddenElements(context.options);
    return {
      Element(node: unknown) {
        if (!isTemplateElement(node) || !forbiddenElements.includes(node.name)) {
          return;
        }
        // eslint-disable-next-line id-denylist -- `data` is the name ESLint's report API requires.
        context.report({ loc: toLocation(node), messageId: 'rawElement', data: { element: node.name } });
      },
    };
  },
};
