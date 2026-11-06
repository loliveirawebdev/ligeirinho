// End to end, through the built package, against the real @ligeirinho/previewer demo app
// (built and served by the webServer in playwright.config.ts).
import { responsiveChecks } from '@ligeirinho/e2e-kit';

responsiveChecks({ previewPath: '/__preview', widths: [390, 768, 1280], themes: ['light', 'dark'] });
