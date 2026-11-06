import { InjectionToken } from '@angular/core';
import type { ScenarioRegistry } from './scenario-entry';

export type PreviewTheme = 'light' | 'dark';

export interface PreviewOptions {
  /** Viewport widths of the side-by-side grid, in CSS px. Default: 390, 768, 1280. */
  readonly widths?: readonly number[];
  /** Themes of the side-by-side grid. Default: light, dark. */
  readonly themes?: readonly PreviewTheme[];
}

export interface PreviewConfig {
  readonly registry: ScenarioRegistry;
  readonly widths: readonly number[];
  readonly themes: readonly PreviewTheme[];
}

export const DEFAULT_PREVIEW_WIDTHS: readonly number[] = [390, 768, 1280];
export const DEFAULT_PREVIEW_THEMES: readonly PreviewTheme[] = ['light', 'dark'];

export const PREVIEW_CONFIG = new InjectionToken<PreviewConfig>('ligeirinho.previewConfig');

export function toPreviewTheme(themeParameter: string | null): PreviewTheme {
  return themeParameter === 'dark' ? 'dark' : 'light';
}
