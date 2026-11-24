import type { Rule } from 'eslint';
import type { TSESTree } from '@typescript-eslint/utils';

/**
 * rules/copy.md: checks the `defineCopy({ en: {...}, 'pt-BR': {...} })` call of a `*.copy.ts` file, with checks that
 * hold in any language. Tone and structure are the agent's review; this rule catches what a machine can.
 */
export interface CopyTextOptions {
  /** Locales every copy must have (`copy.locales` in `.ligeirinho.yml`). */
  readonly locales?: readonly string[];
  /** The locale the copy is written in first and compared against (`copy.source`). Default: the first one. */
  readonly source?: string;
  /** A key ending in `Action` is a button label: at most this many words. Default 4. */
  readonly maxActionWords?: number;
  /** ... and this many characters (for languages written without spaces). Default 28. */
  readonly maxActionLength?: number;
}

interface CopyLeaf {
  readonly path: string;
  readonly texts: readonly string[];
  readonly node: TSESTree.Node;
}

const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'];
const PLACEHOLDER = /\{(\w+)\}/g;

type ObjectProperty = TSESTree.Property & { readonly value: TSESTree.Expression };

function keyName(property: TSESTree.Property): string | undefined {
  if (property.key.type === 'Identifier') {
    return property.key.name;
  }
  return property.key.type === 'Literal' && typeof property.key.value === 'string' ? property.key.value : undefined;
}

function propertiesOf(objectNode: TSESTree.ObjectExpression): ObjectProperty[] {
  return objectNode.properties.filter(
    (property): property is ObjectProperty => property.type === 'Property' && property.value.type !== 'AssignmentPattern',
  );
}

function textOf(node: TSESTree.Node): string | undefined {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis.map((quasi) => quasi.value.cooked ?? '').join('');
  }
  return undefined;
}

function isPluralForms(objectNode: TSESTree.ObjectExpression): boolean {
  const keys = propertiesOf(objectNode).map(keyName);
  return keys.includes('other') && keys.every((key) => key !== undefined && PLURAL_CATEGORIES.includes(key));
}

function leafOf(path: string, value: TSESTree.Expression): CopyLeaf[] {
  const text = textOf(value);
  if (text !== undefined) {
    return [{ path, texts: [text], node: value }];
  }
  if (value.type !== 'ObjectExpression') {
    return [];
  }
  if (isPluralForms(value)) {
    const texts = propertiesOf(value).flatMap((property) => textOf(property.value) ?? []);
    return [{ path, texts, node: value }];
  }
  return copyLeaves(value, `${path}.`);
}

function copyLeaves(objectNode: TSESTree.ObjectExpression, prefix = ''): CopyLeaf[] {
  return propertiesOf(objectNode).flatMap((property) => {
    const key = keyName(property);
    return key === undefined ? [] : leafOf(`${prefix}${key}`, property.value);
  });
}

function placeholdersOf(leaf: CopyLeaf): string {
  const names = leaf.texts.flatMap((text) => [...text.matchAll(PLACEHOLDER)].map((match) => match[1] ?? ''));
  return [...new Set(names)].sort().join(', ');
}

/** Problems a reader sees in any language. Returns the message id of the first one, if any. */
function styleProblem(text: string): string | undefined {
  const words = text.split(/\s+/).filter((word) => /\p{L}{2,}/u.test(word));
  const shouting = words.length >= 2 && words.every((word) => word === word.toLocaleUpperCase() && word !== word.toLocaleLowerCase());
  const checks: readonly [boolean, string][] = [
    [/[!¡]/.test(text), 'exclamation'],
    [/\p{Extended_Pictographic}/u.test(text), 'emoji'],
    [shouting, 'allCaps'],
    [text.includes('...'), 'threeDots'],
    [/["']/.test(text), 'straightQuote'],
    [/^\s|\s$|\s{2,}/.test(text), 'extraSpace'],
  ];
  return checks.find(([failed]) => failed)?.[1];
}

function isCopyCall(node: TSESTree.CallExpression): boolean {
  return node.callee.type === 'Identifier' && node.callee.name === 'defineCopy';
}

function isOptions(ruleOptions: unknown): ruleOptions is CopyTextOptions {
  return typeof ruleOptions === 'object' && ruleOptions !== null;
}

function readOptions(ruleOptions: readonly unknown[]): CopyTextOptions {
  const [firstOption] = ruleOptions;
  return isOptions(firstOption) ? firstOption : {};
}

const optionsSchema = {
  type: 'object',
  properties: {
    locales: { type: 'array', items: { type: 'string' } },
    source: { type: 'string' },
    maxActionWords: { type: 'integer', minimum: 1 },
    maxActionLength: { type: 'integer', minimum: 1 },
  },
  additionalProperties: false,
};

export const copyText: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Checks the copy of every locale: same keys, same placeholders, language-neutral style.' },
    schema: [optionsSchema],
    messages: {
      missingLocale: 'The copy has no "{{locale}}" locale (copy.locales in .ligeirinho.yml). See rules/copy.md.',
      missingKey: '"{{key}}" is in "{{source}}" but missing in "{{locale}}". Every locale has every key.',
      extraKey: '"{{key}}" is in "{{locale}}" but not in "{{source}}". Add it to the source locale first.',
      placeholders:
        '"{{key}}" in "{{locale}}" uses {{found}} but "{{source}}" uses {{expected}}. Translations keep the same ' +
        'placeholders.',
      longAction:
        '"{{key}}" is a button label ("…Action") of {{size}}: keep it to a verb and its object. See rules/copy.md.',
      exclamation: '"{{key}}": no exclamation marks; the register is formal. See rules/copy.md.',
      emoji: '"{{key}}": no emoji in interface text. See rules/copy.md.',
      allCaps: '"{{key}}": no text in capitals; emphasis comes from the type scale. See rules/copy.md.',
      threeDots: '"{{key}}": use the ellipsis character (…), not three dots. See rules/copy.md.',
      straightQuote: '"{{key}}": use typographic quotes and apostrophes (’ “ ” or the locale’s « »). See rules/copy.md.',
      extraSpace: '"{{key}}": no leading, trailing or double spaces; spacing is layout. See rules/copy.md.',
    },
  },
  create(context) {
    const options = readOptions(context.options);
    const maxActionWords = options.maxActionWords ?? 4;
    const maxActionLength = options.maxActionLength ?? 28;

    // eslint-disable-next-line id-denylist -- `data` is the name ESLint's report API requires.
    const report = (node: TSESTree.Node, messageId: string, data: Record<string, string>): void => {
      // eslint-disable-next-line id-denylist -- `data` is the name ESLint's report API requires.
      context.report({ loc: node.loc, messageId, data });
    };

    const checkLeaf = (leaf: CopyLeaf): void => {
      const problem = leaf.texts.map(styleProblem).find((messageId) => messageId !== undefined);
      if (problem !== undefined) {
        report(leaf.node, problem, { key: leaf.path });
      }
      const isAction = leaf.path.endsWith('Action');
      const tooLong = leaf.texts.some((text) => text.split(/\s+/).length > maxActionWords || text.length > maxActionLength);
      if (isAction && tooLong) {
        report(leaf.node, 'longAction', { key: leaf.path, size: `"${leaf.texts.join(' / ')}"` });
      }
    };

    const compareLocales = (source: [string, CopyLeaf[]], other: [string, CopyLeaf[]]): void => {
      const [sourceLocale, sourceLeaves] = source;
      const [locale, leaves] = other;
      const byPath = new Map(leaves.map((leaf) => [leaf.path, leaf]));
      const sourcePaths = new Set(sourceLeaves.map((leaf) => leaf.path));
      for (const sourceLeaf of sourceLeaves) {
        const leaf = byPath.get(sourceLeaf.path);
        const names = { key: sourceLeaf.path, locale, source: sourceLocale };
        if (leaf === undefined) {
          report(sourceLeaf.node, 'missingKey', names);
        } else if (placeholdersOf(leaf) !== placeholdersOf(sourceLeaf)) {
          const found = placeholdersOf(leaf) || 'no placeholders';
          report(leaf.node, 'placeholders', { ...names, found, expected: placeholdersOf(sourceLeaf) || 'none' });
        }
      }
      leaves
        .filter((leaf) => !sourcePaths.has(leaf.path))
        .forEach((leaf) => report(leaf.node, 'extraKey', { key: leaf.path, locale, source: sourceLocale }));
    };

    return {
      CallExpression(node: TSESTree.CallExpression) {
        const [copyArgument] = node.arguments;
        if (!isCopyCall(node) || copyArgument?.type !== 'ObjectExpression') {
          return;
        }
        const locales = propertiesOf(copyArgument).flatMap((property): [string, CopyLeaf[]][] => {
          const locale = keyName(property);
          return locale === undefined || property.value.type !== 'ObjectExpression' ? [] : [[locale, copyLeaves(property.value)]];
        });
        const present = new Set(locales.map(([locale]) => locale));
        (options.locales ?? [])
          .filter((locale) => !present.has(locale))
          .forEach((locale) => report(copyArgument, 'missingLocale', { locale }));
        const source = locales.find(([locale]) => locale === options.source) ?? locales[0];
        if (source === undefined) {
          return;
        }
        locales.flatMap(([, leaves]) => leaves).forEach(checkLeaf);
        locales.filter((entry) => entry !== source).forEach((entry) => compareLocales(source, entry));
      },
    } as Rule.RuleListener;
  },
};
