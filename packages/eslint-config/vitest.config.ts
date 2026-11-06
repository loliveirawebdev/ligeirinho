import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    exclude: ['test/fixtures/**'],
    // The first type-aware lint of each file boots the TypeScript project service.
    testTimeout: 60_000,
  },
});
