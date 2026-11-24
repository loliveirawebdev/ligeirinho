import { responsiveChecks } from '../../src/index.js';
import { axeViolationPage } from '../fixtures/pages.js';
import { fakePreviewerTest } from './fake-previewer.js';

// axe runs at the first width only: 390 reports the unlabeled field, 768 doesn't look.
responsiveChecks({
  previewPath: '/__preview',
  widths: [390, 768],
  themes: ['light'],
  groups: 1,
  test: fakePreviewerTest({ 'signup-form': { unlabeled: axeViolationPage } }),
});
