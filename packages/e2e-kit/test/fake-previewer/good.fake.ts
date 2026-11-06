import { responsiveChecks } from '../../src/index.js';
import { goodPage } from '../fixtures/pages.js';
import { fakePreviewerTest } from './fake-previewer.js';

responsiveChecks({
  previewPath: '/__preview',
  widths: [390, 768],
  themes: ['light'],
  test: fakePreviewerTest({ card: { default: goodPage, other: goodPage } }),
});
