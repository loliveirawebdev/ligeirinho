import angular from '@analogjs/vite-plugin-angular';
import { join, relative, resolve } from 'node:path';
import swc from 'unplugin-swc';
import type { PluginOption } from 'vite';
import { defineConfig, type ViteUserConfig } from 'vitest/config';

// One Vitest setup for every project (rule of two): each project's config is a single call to a preset.
// `vitest --mode integration` runs only *.integration.spec.ts (against the real test database);
// the default mode runs everything else.

const workspaceRoot = resolve(import.meta.dirname, '../..');

interface ProjectPresetOptions {
  readonly name: string;
  readonly projectRoot: string;
}

function sharedTestConfig(options: ProjectPresetOptions, mode: string, plugins: PluginOption[]): ViteUserConfig {
  const isIntegration = mode === 'integration';
  const projectPath = relative(workspaceRoot, options.projectRoot);
  return {
    root: options.projectRoot,
    cacheDir: join(workspaceRoot, 'node_modules/.vite', projectPath),
    plugins,
    resolve: { tsconfigPaths: true },
    test: {
      name: options.name,
      watch: false,
      globals: true,
      include: isIntegration ? ['src/**/*.integration.spec.ts'] : ['src/**/*.spec.ts'],
      exclude: isIntegration ? [] : ['src/**/*.integration.spec.ts'],
      passWithNoTests: true,
      // Integration tests share one database, so their files run one after another.
      fileParallelism: !isIntegration,
      reporters: ['default'],
      coverage: { reportsDirectory: join(workspaceRoot, 'coverage', projectPath), provider: 'v8' },
    },
  };
}

/** Plain TypeScript projects (domain, application, infrastructure). */
export function nodeProject(options: ProjectPresetOptions) {
  return defineConfig(({ mode }) => {
    const config = sharedTestConfig(options, mode, []);
    return { ...config, test: { ...config.test, environment: 'node' } };
  });
}

/** Nest projects: SWC emits the decorator metadata Nest's dependency injection reads. */
export function nestProject(options: ProjectPresetOptions) {
  return defineConfig(({ mode }) => {
    const swcPlugin = swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2022',
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    });
    const config = sharedTestConfig(options, mode, [swcPlugin]);
    return { ...config, test: { ...config.test, environment: 'node' } };
  });
}

/** Angular projects (views, pages, design system). */
export function angularProject(options: ProjectPresetOptions) {
  return defineConfig(({ mode }) => {
    const config = sharedTestConfig(options, mode, [angular({ tsconfig: join(options.projectRoot, 'tsconfig.spec.json') })]);
    // Angular Material components render slowly in jsdom while the gate builds in parallel: 5 s is too tight.
    const test = { ...config.test, environment: 'jsdom', setupFiles: ['src/test-setup.ts'], testTimeout: 15_000 };
    return { ...config, test };
  });
}
