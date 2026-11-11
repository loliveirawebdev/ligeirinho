import { responsiveChecks } from '../../src/index.js';
import { goodPage } from '../fixtures/pages.js';
import { fakePreviewerTest } from './fake-previewer.js';

responsiveChecks({
  previewPath: '/__preview',
  viewports: [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ],
  themes: ['dark'],
  test: fakePreviewerTest({ card: { default: goodPage } }),
});
