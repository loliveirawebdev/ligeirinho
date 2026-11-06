import { responsiveChecks } from '../../src/index.js';
import { axeViolationPage, clippedButtonPage, goodPage, tinyButtonPage, widePage } from '../fixtures/pages.js';
import { fakePreviewerTest } from './fake-previewer.js';

responsiveChecks({
  previewPath: '/__preview',
  widths: [390],
  themes: ['dark'],
  test: fakePreviewerTest({
    'report-table': { wide: widePage, fine: goodPage },
    'delete-dialog': { clipped: clippedButtonPage },
    toolbar: { tiny: tinyButtonPage },
    'signup-form': { unlabeled: axeViolationPage },
  }),
});
