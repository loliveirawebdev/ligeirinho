import { responsiveChecks } from '../../src/index.js';
import { fakePreviewerTest } from './fake-previewer.js';

responsiveChecks({
  previewPath: '/__preview',
  widths: [1280],
  themes: ['light'],
  test: fakePreviewerTest({}),
});
