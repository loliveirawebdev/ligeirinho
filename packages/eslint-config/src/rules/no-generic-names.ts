import path from 'node:path';
import type { Rule } from 'eslint';

export const genericNames: readonly string[] = ['utils', 'helpers', 'helper', 'manager', 'common', 'misc'];

/** Folders of the path (relative to the lint cwd) plus each dot-separated part of the file name. */
function namesInPath(relativeFilePath: string): string[] {
  const segments = relativeFilePath.split(path.sep);
  const fileName = segments.pop() ?? '';
  return [...segments, ...fileName.split('.')];
}

export const noGenericNames: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbids utils, helpers, manager, common and misc as file or folder names.' },
    schema: [],
    messages: {
      genericName:
        '"{{name}}" is a junk drawer name. Name the file or folder after what it does (`libs/text/strip-accents.ts`, ' +
        'never `utils/string.ts`). See rules/architecture.md.',
    },
  },
  create(context) {
    return {
      Program(node) {
        const relativeFilePath = path.relative(context.cwd, context.physicalFilename);
        const genericName = namesInPath(relativeFilePath).find((name) => genericNames.includes(name));
        if (genericName === undefined) {
          return;
        }
        // eslint-disable-next-line id-denylist -- `data` is the name ESLint's report API requires.
        context.report({ node, messageId: 'genericName', data: { name: genericName } });
      },
    };
  },
};
