import { responsiveChecks } from '@ligeirinho/e2e-kit';

// Every previewer scenario, at every width and theme: no horizontal scroll, nothing clipped, touch targets of at
// least 44 px, icons drawn as icons and no axe violations (rules/responsive.md). The screenshots are for the
// visual review (rules/design.md "The review"): open them, don't just trust the checks.
responsiveChecks({
  previewPath: '/__preview',
  widths: [390, 768, 1280],
  themes: ['light', 'dark'],
  screenshotsDir: 'test-results/screens',
});
