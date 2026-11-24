import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Rule } from 'eslint';
import { isTemplateElement, staticAttributeValue, staticText } from './template-ast.js';

/** The icon names `material-symbols` ships, quoted in its type declarations. */
export const defaultIconNamesFile = 'node_modules/material-symbols/index.d.ts';

const iconNamesByFile = new Map<string, ReadonlySet<string>>();

function readIconNames(filePath: string): ReadonlySet<string> | undefined {
  const cached = iconNamesByFile.get(filePath);
  if (cached !== undefined) {
    return cached;
  }
  try {
    const declarations = readFileSync(filePath, 'utf8');
    const iconNames = new Set([...declarations.matchAll(/"([a-z0-9_]+)"/g)].map((match) => match[1] ?? ''));
    iconNamesByFile.set(filePath, iconNames);
    return iconNames;
  } catch {
    // Not installed (a fresh checkout before `pnpm install`): nothing to check against, so the rule stays quiet.
    return undefined;
  }
}

/**
 * The file from the working directory up: Nx runs ESLint from each project's folder (`libs/ui`), where there is no
 * `node_modules`, so a path relative to it alone would find nothing and leave the rule quiet.
 */
function findUpwards(startDirectory: string, relativePath: string): string | undefined {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  let directory = path.resolve(startDirectory);
  for (;;) {
    const candidate = path.join(directory, relativePath);
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      return undefined;
    }
    directory = parent;
  }
}

interface KnownIconsOptions {
  readonly iconNamesFile?: string;
}

function isOptions(ruleOptions: unknown): ruleOptions is KnownIconsOptions {
  return typeof ruleOptions === 'object' && ruleOptions !== null;
}

/** A `<mat-icon>` with an unknown name draws the name as text ("arrow_bak") instead of an icon. */
export const knownIcons: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Requires <mat-icon> names to exist in Material Symbols.' },
    schema: [
      { type: 'object', properties: { iconNamesFile: { type: 'string' } }, additionalProperties: false },
    ],
    messages: {
      unknownIcon:
        '"{{name}}" is not a Material Symbols icon, so the screen shows the word instead of the icon. ' +
        'Find the right name at https://fonts.google.com/icons. See rules/design.md "Icons and imagery".',
    },
  },
  create(context) {
    const [firstOption] = context.options;
    const iconNamesFile = (isOptions(firstOption) ? firstOption.iconNamesFile : undefined) ?? defaultIconNamesFile;
    const iconNamesPath = findUpwards(context.cwd, iconNamesFile);
    const iconNames = iconNamesPath === undefined ? undefined : readIconNames(iconNamesPath);
    if (iconNames === undefined) {
      return {};
    }
    return {
      Element(node: unknown) {
        if (!isTemplateElement(node) || node.name !== 'mat-icon') {
          return;
        }
        const name = staticAttributeValue(node, 'fontIcon') ?? staticText(node);
        if (name !== undefined && name !== '' && !iconNames.has(name)) {
          // eslint-disable-next-line id-denylist -- `data` is the name ESLint's report API requires.
          context.report({ loc: node.loc, messageId: 'unknownIcon', data: { name } });
        }
      },
    };
  },
};
