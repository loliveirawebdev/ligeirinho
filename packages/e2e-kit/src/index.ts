export { defineLigeirinhoConfig, type LigeirinhoConfigOptions } from './define-ligeirinho-config.js';
export { responsiveChecks, type ResponsiveChecksOptions, type ResponsiveViewport } from './responsive-checks.js';
export {
  PreviewManifestMissing,
  buildRenderUrl,
  readPreviewManifest,
  type PreviewEntrySummary,
  type PreviewManifest,
  type PreviewTheme,
} from './preview-manifest.js';
export {
  checkNoHorizontalScroll,
  findHorizontalOverflow,
  type HorizontalOverflow,
} from './checks/no-horizontal-scroll.js';
export {
  checkClickablesInView,
  findClickablesOutOfView,
  type ClickableOutOfView,
} from './checks/clickables-in-view.js';
export {
  MINIMUM_TARGET_SIZE,
  checkTouchTargetSize,
  findSmallTouchTargets,
  type SmallTouchTarget,
} from './checks/touch-target-size.js';
export {
  WCAG_21_AA_TAGS,
  checkAccessibility,
  findAccessibilityViolations,
  type AccessibilityViolation,
} from './checks/accessibility.js';
export { CLICKABLE_SELECTOR } from './checks/clickable-inspection.js';
