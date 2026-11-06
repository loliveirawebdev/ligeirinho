import { applyAdoption, type AdoptionOption } from './adoption.js';
import { ligeirinhoPlugin, ligeirinhoPluginPrefix } from './ligeirinho-plugin.js';
import type { FlatConfig, RuleEntry } from './flat-config.js';

export interface NestOptions extends AdoptionOption {
  /** TypeScript files of the Nest API, e.g. `['apps/api/**\/*.ts', 'libs/**\/api/**\/*.ts']`. */
  readonly files: string[];
}

interface ImportRestriction {
  readonly group: string[];
  readonly message: string;
}

function restrictImports(...restrictions: ImportRestriction[]): RuleEntry {
  return ['error', { patterns: restrictions }];
}

const infrastructureImport: ImportRestriction = {
  group: ['**/infrastructure', '**/infrastructure/**'],
  message:
    'A controller talks to use cases (application layer), never to adapters. Infrastructure is wired in the module. ' +
    'See rules/architecture.md.',
};

const frameworkImport: ImportRestriction = {
  group: ['@nestjs/*', '@prisma/*', 'prisma', 'express', 'fastify'],
  message: 'The domain is pure business rules: no framework, no Prisma, no IO. See rules/architecture.md.',
};

const prismaImport: ImportRestriction = {
  group: ['@prisma/*', 'prisma'],
  message: 'Use cases depend on ports; Prisma lives in infrastructure adapters. See rules/architecture.md.',
};

function filesInFolder(files: string[], folderGlob: string): string[][] {
  return files.map((fileGlob) => [fileGlob, folderGlob]);
}

/** rules/architecture.md: layers point inward, the clock is a port. */
export function nest(options: NestOptions): FlatConfig[] {
  const files = options.files;
  const plugins = { [ligeirinhoPluginPrefix]: ligeirinhoPlugin };
  const configs: FlatConfig[] = [
    { files: filesInFolder(files, '**/*.controller.ts'), rules: { 'no-restricted-imports': restrictImports(infrastructureImport) } },
    { files: filesInFolder(files, '**/domain/**'), rules: { 'no-restricted-imports': restrictImports(frameworkImport) } },
    { files: filesInFolder(files, '**/application/**'), rules: { 'no-restricted-imports': restrictImports(prismaImport) } },
    {
      files: [...filesInFolder(files, '**/domain/**'), ...filesInFolder(files, '**/application/**')],
      plugins,
      rules: { '@ligeirinho/no-system-clock': 'error' },
    },
  ];
  return applyAdoption(configs, options.adoption);
}
