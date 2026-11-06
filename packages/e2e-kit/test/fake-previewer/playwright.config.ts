// Run by test/responsive-checks.spec.ts in a child process, so failing runs can be asserted on.
import { defineLigeirinhoConfig } from '../../src/index.js';

export default defineLigeirinhoConfig({
  testDir: '.',
  testMatch: '*.fake.ts',
  outputDir: '../../test-results/fake-previewer',
});
