import type { AST, Rule } from 'eslint';

export const defaultRawElements: readonly string[] = ['button', 'input', 'select', 'textarea', 'table', 'dialog'];

/** A regular expression as rule options can carry it (options are JSON). */
export interface AttributePattern {
  readonly pattern: string;
  readonly flags?: string;
}

/** Spartan helm directives sit on native elements: `<button hlmBtn>`, `<input hlmInput>`. */
export const defaultDesignSystemAttributes: readonly AttributePattern[] = [{ pattern: '^hlm', flags: 'i' }];

interface TemplatePosition {
  readonly line: number;
  readonly col: number;
}

interface NamedNode {
  readonly name: string;
}

/** The part of an `@angular-eslint/template-parser` `Element` node this rule reads. */
interface TemplateElement extends NamedNode {
  readonly startSourceSpan: { readonly start: TemplatePosition; readonly end: TemplatePosition };
  readonly attributes: readonly NamedNode[];
  readonly inputs: readonly NamedNode[];
}

interface NoRawElementsOptions {
  readonly elements?: readonly string[];
  readonly designSystemAttributes?: readonly AttributePattern[];
}

function isNamedNode(node: unknown): node is NamedNode {
  return typeof node === 'object' && node !== null && 'name' in node && typeof node.name === 'string';
}

function isTemplateElement(node: unknown): node is TemplateElement {
  if (!isNamedNode(node)) {
    return false;
  }
  const hasAttributeLists = 'attributes' in node && Array.isArray(node.attributes) && 'inputs' in node && Array.isArray(node.inputs);
  return hasAttributeLists && 'startSourceSpan' in node;
}

function isNoRawElementsOptions(ruleOptions: unknown): ruleOptions is NoRawElementsOptions {
  return typeof ruleOptions === 'object' && ruleOptions !== null;
}

function readOptions(ruleOptions: readonly unknown[]): { elements: readonly string[]; attributePatterns: RegExp[] } {
  const [firstOption] = ruleOptions;
  const options: NoRawElementsOptions = isNoRawElementsOptions(firstOption) ? firstOption : {};
  const attributes = options.designSystemAttributes ?? defaultDesignSystemAttributes;
  return {
    elements: options.elements ?? defaultRawElements,
    attributePatterns: attributes.map(({ pattern, flags }) => new RegExp(pattern, flags)),
  };
}

function carriesDesignSystemAttribute(element: TemplateElement, attributePatterns: readonly RegExp[]): boolean {
  const attributeNames = [...element.attributes, ...element.inputs].map((attribute) => attribute.name);
  return attributeNames.some((attributeName) => attributePatterns.some((pattern) => pattern.test(attributeName)));
}

/** Angular source spans are 0-based lines; ESLint locations are 1-based lines. */
function toLocation(element: TemplateElement): AST.SourceLocation {
  const { start, end } = element.startSourceSpan;
  return {
    start: { line: start.line + 1, column: start.col },
    end: { line: end.line + 1, column: end.col },
  };
}

const attributePatternSchema = {
  type: 'object',
  properties: { pattern: { type: 'string' }, flags: { type: 'string' } },
  required: ['pattern'],
  additionalProperties: false,
};

export const noRawElements: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbids raw interactive HTML elements outside the design system.' },
    schema: [
      {
        type: 'object',
        properties: {
          elements: { type: 'array', items: { type: 'string' } },
          designSystemAttributes: { type: 'array', items: attributePatternSchema },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      rawElement:
        'Raw <{{element}}> is only allowed inside the design system or with a design system directive (`<button hlmBtn>`). ' +
        'The design system solves accessibility, states and responsiveness once. ' +
        'See rules/mvvm.md "Raw elements only in the design system".',
    },
  },
  create(context) {
    const { elements, attributePatterns } = readOptions(context.options);
    return {
      Element(node: unknown) {
        const isRaw =
          isTemplateElement(node) &&
          elements.includes(node.name) &&
          !carriesDesignSystemAttribute(node, attributePatterns);
        if (!isRaw) {
          return;
        }
        // eslint-disable-next-line id-denylist -- `data` is the name ESLint's report API requires.
        context.report({ loc: toLocation(node), messageId: 'rawElement', data: { element: node.name } });
      },
    };
  },
};
