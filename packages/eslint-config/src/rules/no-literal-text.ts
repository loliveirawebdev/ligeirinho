import type { Rule } from 'eslint';
import { ElementStack, isTemplateElement, isTemplateNode, type TemplateNode } from './template-ast.js';

/** Elements whose text is not copy: an icon's ligature name, code. */
export const defaultIgnoredTextElements: readonly string[] = ['mat-icon', 'code', 'pre', 'kbd'];

/** Attributes the user reads or hears. Their static values must come from the copy too. */
export const defaultTextAttributes: readonly string[] = [
  'aria-label',
  'aria-description',
  'aria-placeholder',
  'aria-roledescription',
  'aria-valuetext',
  'alt',
  'label',
  'placeholder',
  'title',
];

interface NoLiteralTextOptions {
  readonly ignoreElements?: readonly string[];
  readonly textAttributes?: readonly string[];
}

const LETTER = /\p{L}/u;

function hasLetters(text: unknown): boolean {
  return typeof text === 'string' && LETTER.test(text);
}

function field(node: unknown, name: string): unknown {
  return typeof node === 'object' && node !== null ? Reflect.get(node, name) : undefined;
}

function listField(node: unknown, name: string): readonly unknown[] {
  const value = field(node, name);
  return Array.isArray(value) ? value : [];
}

/**
 * The string literals an expression can print: `{{ busy ? 'Adding…' : 'Add task' }}`, `{{ 'Hi ' + name }}`,
 * `` {{ `Hi ${name}` }} ``. Pipe arguments (`date:'short'`), comparisons and call arguments are not printed.
 */
function printedLiterals(expression: unknown): string[] {
  switch (field(expression, 'type')) {
    case 'LiteralPrimitive':
      return typeof field(expression, 'value') === 'string' ? [String(field(expression, 'value'))] : [];
    case 'ASTWithSource':
      return printedLiterals(field(expression, 'ast'));
    case 'Interpolation':
      return [...listField(expression, 'strings').map(String), ...listField(expression, 'expressions').flatMap(printedLiterals)];
    case 'Conditional':
      return [...printedLiterals(field(expression, 'trueExp')), ...printedLiterals(field(expression, 'falseExp'))];
    case 'Binary':
      return field(expression, 'operation') === '+'
        ? [...printedLiterals(field(expression, 'left')), ...printedLiterals(field(expression, 'right'))]
        : [];
    case 'ParenthesizedExpression':
      return printedLiterals(field(expression, 'expression'));
    case 'BindingPipe':
      return printedLiterals(field(expression, 'exp'));
    case 'TemplateLiteral':
      return listField(expression, 'elements').map((element) => String(field(element, 'text')));
    default:
      return [];
  }
}

function isOptions(ruleOptions: unknown): ruleOptions is NoLiteralTextOptions {
  return typeof ruleOptions === 'object' && ruleOptions !== null;
}

function readOptions(ruleOptions: readonly unknown[]): Required<NoLiteralTextOptions> {
  const [firstOption] = ruleOptions;
  const options: NoLiteralTextOptions = isOptions(firstOption) ? firstOption : {};
  return {
    ignoreElements: options.ignoreElements ?? defaultIgnoredTextElements,
    textAttributes: options.textAttributes ?? defaultTextAttributes,
  };
}

export const noLiteralText: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbids user-facing text written in templates: every string comes from the copy.' },
    schema: [
      {
        type: 'object',
        properties: {
          ignoreElements: { type: 'array', items: { type: 'string' } },
          textAttributes: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      literalText:
        'Text written in the template: "{{text}}". Every string the user reads or hears comes from the copy ' +
        '(`*.copy.ts`, through the view-model or an input), so it has one key, one wording and every locale. ' +
        'See rules/copy.md.',
    },
  },
  create(context) {
    const { ignoreElements, textAttributes } = readOptions(context.options);
    const stack = new ElementStack();
    const insideIgnored = (): boolean => stack.all().some((element) => ignoreElements.includes(element.name));
    const report = (node: TemplateNode, text: string): void => {
      // eslint-disable-next-line id-denylist -- `data` is the name ESLint's report API requires.
      context.report({ loc: node.loc, messageId: 'literalText', data: { text: text.trim().slice(0, 40) } });
    };
    const reportPrinted = (node: unknown, expression: unknown): void => {
      const literal = printedLiterals(expression).find(hasLetters);
      if (isTemplateNode(node) && literal !== undefined && !insideIgnored()) {
        report(node, literal);
      }
    };
    return {
      Element(node: unknown) {
        if (isTemplateElement(node)) {
          stack.enter(node);
        }
      },
      'Element:exit'(node: unknown) {
        if (isTemplateElement(node)) {
          stack.exit();
        }
      },
      Text(node: unknown) {
        const text = field(node, 'value');
        if (isTemplateNode(node) && hasLetters(text) && !insideIgnored()) {
          report(node, String(text));
        }
      },
      BoundText(node: unknown) {
        reportPrinted(node, field(node, 'value'));
      },
      TextAttribute(node: unknown) {
        const text = field(node, 'value');
        if (isTemplateNode(node) && textAttributes.includes(String(field(node, 'name'))) && hasLetters(text)) {
          report(node, String(text));
        }
      },
      BoundAttribute(node: unknown) {
        if (textAttributes.includes(String(field(node, 'name')))) {
          reportPrinted(node, field(node, 'value'));
        }
      },
    };
  },
};
