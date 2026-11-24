import type { Rule } from 'eslint';
import {
  ElementStack,
  childElements,
  classTokens,
  hasAttribute,
  isTemplateElement,
  staticAttributeValue,
  type TemplateElement,
} from './template-ast.js';

function isNavigation(element: TemplateElement): boolean {
  return element.name === 'nav' || staticAttributeValue(element, 'role') === 'navigation';
}

/** rules/design.md: `mat-nav-list` is navigation, so it lives in a `<nav>`; a list of records is a list. */
export const navListInNav: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Requires mat-nav-list to sit inside a <nav>.' },
    schema: [],
    messages: {
      outsideNav:
        '`mat-nav-list` is for navigation and belongs inside a `<nav>` (the app shell has it). A list of records ' +
        'the user opens is `mat-action-list` or the catalog list. See rules/design.md "Controls".',
    },
  },
  create(context) {
    const stack = new ElementStack();
    return {
      Element(node: unknown) {
        if (!isTemplateElement(node)) {
          return;
        }
        stack.enter(node);
        if (node.name === 'mat-nav-list' && !stack.parents().some(isNavigation)) {
          context.report({ loc: node.loc, messageId: 'outsideNav' });
        }
      },
      'Element:exit'(node: unknown) {
        if (isTemplateElement(node)) {
          stack.exit();
        }
      },
    };
  },
};

const BUTTON_LIKE = ['button', 'a'];
const TEXT_BLOCKS = ['p', 'div'];

/** rules/design.md: an icon beside a block of text lines up with its first line, never with the block's middle. */
export const iconAlignsWithText: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbids centering an icon on a block of text that can wrap.' },
    schema: [],
    messages: {
      centeredIcon:
        'An icon beside a block of text is centered on the block (`items-center`), so it drifts to the middle when ' +
        'the text wraps. Use `items-start` on the row: the icon (24 px) lines up with the first line. ' +
        'See rules/design.md "Spacing and alignment".',
    },
  },
  create(context) {
    return {
      Element(node: unknown) {
        // In a column (`flex-col`), `items-center` centers across the line, which is fine.
        const classes = isTemplateElement(node) ? classTokens(node) : [];
        if (!isTemplateElement(node) || BUTTON_LIKE.includes(node.name) || !classes.includes('items-center') || classes.includes('flex-col')) {
          return;
        }
        const children = childElements(node);
        const icon = children.find((child) => child.name === 'mat-icon');
        if (icon !== undefined && children.some((child) => TEXT_BLOCKS.includes(child.name))) {
          context.report({ loc: icon.loc, messageId: 'centeredIcon' });
        }
      },
    };
  },
};

const SUFFIX_ATTRIBUTES = ['matSuffix', 'matIconSuffix', 'matTextSuffix'];

/** rules/design.md: a field's action is an attached Input Group; a suffix is only an icon button (clear, show). */
export const noSuffixButton: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbids text buttons inside a form field suffix.' },
    schema: [],
    messages: {
      suffixButton:
        'A text button inside the field (`matSuffix`) hides the action and shrinks the input. The field’s action ' +
        'is an Input Group (`ui-input-group`); a suffix only holds an icon button such as clear or show password ' +
        '(`matIconButton`). See rules/design.md "Controls".',
    },
  },
  create(context) {
    return {
      Element(node: unknown) {
        const isTextButtonSuffix =
          isTemplateElement(node) &&
          BUTTON_LIKE.includes(node.name) &&
          hasAttribute(node, SUFFIX_ATTRIBUTES) &&
          !hasAttribute(node, ['matIconButton']);
        if (isTextButtonSuffix) {
          context.report({ loc: node.loc, messageId: 'suffixButton' });
        }
      },
    };
  },
};
