import { responsiveChecks } from '@ligeirinho/e2e-kit';

// Every previewer scenario, at every width and theme: no horizontal scroll, nothing clipped,
// touch targets of at least 44 px and no axe violations (rules/responsive.md).
responsiveChecks({ previewPath: '/__preview', widths: [390, 768, 1280], themes: ['light', 'dark'] });
