import { responsiveChecks } from '../../src/index.js';
import { goodPage, widePage } from '../fixtures/pages.js';
import { fakePreviewerTest } from './fake-previewer.js';

// Entries are dealt to the groups in turn: first and third to group 1, the wide one to group 2.
responsiveChecks({
  previewPath: '/__preview',
  widths: [390],
  themes: ['light'],
  groups: 2,
  test: fakePreviewerTest({ first: { default: goodPage }, wide: { default: widePage }, third: { default: goodPage } }),
});
