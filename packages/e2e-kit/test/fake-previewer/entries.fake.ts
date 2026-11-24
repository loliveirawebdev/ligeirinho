import { responsiveChecks } from '../../src/index.js';
import { goodPage, widePage } from '../fixtures/pages.js';
import { fakePreviewerTest } from './fake-previewer.js';

// Only `card` is checked, so the wide page in `report` doesn't fail the run.
responsiveChecks({
  previewPath: '/__preview',
  widths: [390],
  themes: ['light'],
  groups: 1,
  entries: ['card'],
  test: fakePreviewerTest({ card: { default: goodPage }, report: { wide: widePage } }),
});
