import type { AST } from 'eslint';

/**
 * The parts of `@angular-eslint/template-parser` nodes the template rules read. Every node carries an ESLint `loc`;
 * the guards below check the fields each rule relies on, so a parser change fails the rule instead of crashing it.
 */
export interface TemplateNode {
  readonly type: string;
  readonly loc: AST.SourceLocation;
}

export interface TemplateAttribute extends TemplateNode {
  readonly name: string;
  readonly value: unknown;
}

export interface TemplateElement extends TemplateNode {
  readonly name: string;
  readonly attributes: readonly TemplateAttribute[];
  readonly inputs: readonly TemplateAttribute[];
  readonly children: readonly unknown[];
}

function isObject(node: unknown): node is Record<string, unknown> {
  return typeof node === 'object' && node !== null;
}

export function isTemplateNode(node: unknown): node is TemplateNode {
  return isObject(node) && typeof node['type'] === 'string' && isObject(node['loc']);
}

export function isTemplateElement(node: unknown): node is TemplateElement {
  return (
    isTemplateNode(node) &&
    node.type === 'Element' &&
    'name' in node &&
    typeof node.name === 'string' &&
    'attributes' in node &&
    Array.isArray(node.attributes) &&
    'inputs' in node &&
    Array.isArray(node.inputs) &&
    'children' in node &&
    Array.isArray(node.children)
  );
}

function attributesOf(element: TemplateElement): TemplateAttribute[] {
  return [...element.attributes, ...element.inputs];
}

/** True when a static attribute or an input binding has one of `names` (`matSuffix`, `[matSuffix]`). */
export function hasAttribute(element: TemplateElement, names: readonly string[]): boolean {
  return attributesOf(element).some((attribute) => names.includes(attribute.name));
}

/** The static value of an attribute (`class="a b"`), or undefined when it is missing or bound. */
export function staticAttributeValue(element: TemplateElement, name: string): string | undefined {
  const attribute = element.attributes.find((candidate) => candidate.name === name);
  return typeof attribute?.value === 'string' ? attribute.value : undefined;
}

export function classTokens(element: TemplateElement): string[] {
  return (staticAttributeValue(element, 'class') ?? '').split(/\s+/).filter((token) => token !== '');
}

export function childElements(element: TemplateElement): TemplateElement[] {
  return element.children.filter(isTemplateElement);
}

/** The element's own static text (`<mat-icon>add</mat-icon>` → `add`), or undefined when it has anything else. */
export function staticText(element: TemplateElement): string | undefined {
  const [onlyChild, ...otherChildren] = element.children;
  if (otherChildren.length > 0 || !isObject(onlyChild) || onlyChild['type'] !== 'Text') {
    return undefined;
  }
  const text = onlyChild['value'];
  return typeof text === 'string' ? text.trim() : undefined;
}

/**
 * Tracks the open elements while ESLint walks the template, so a rule can ask what an element sits in. Call `enter`
 * at the start of the rule's `Element` listener and `exit` in its `Element:exit` listener.
 */
export class ElementStack {
  private readonly openElements: TemplateElement[] = [];

  enter(element: TemplateElement): void {
    this.openElements.push(element);
  }

  exit(): void {
    this.openElements.pop();
  }

  /** The elements around the one being visited, outermost first. */
  parents(): readonly TemplateElement[] {
    return this.openElements.slice(0, -1);
  }

  /** Every open element, the one being visited included. */
  all(): readonly TemplateElement[] {
    return this.openElements;
  }
}
