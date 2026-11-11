import { InjectionToken } from '@angular/core';
import type { ScenarioRegistry } from './scenario-entry';

export type PreviewTheme = 'light' | 'dark';

/** A device preset of the workbench: a named viewport size. */
export interface PreviewViewport {
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

/** A width marked on the workbench's ruler (the app's CSS breakpoints); clicking it sets the frame width. */
export interface PreviewBreakpoint {
  readonly label: string;
  readonly width: number;
}

export interface PreviewOptions {
  /** Device presets of the workbench. Default: phones, tablets and desktops (see `DEFAULT_PREVIEW_VIEWPORTS`). */
  readonly viewports?: readonly PreviewViewport[];
  /** Breakpoints marked on the ruler. Default: Tailwind's sm, md, lg, xl, 2xl. */
  readonly breakpoints?: readonly PreviewBreakpoint[];
  /** Themes the workbench can switch between. Default: light, dark. */
  readonly themes?: readonly PreviewTheme[];
  /** Extra width presets (`<width> px`), at the workbench's default height. Kept for older configs. */
  readonly widths?: readonly number[];
}

export interface PreviewConfig {
  readonly registry: ScenarioRegistry;
  readonly viewports: readonly PreviewViewport[];
  readonly breakpoints: readonly PreviewBreakpoint[];
  readonly themes: readonly PreviewTheme[];
}

export const DEFAULT_PREVIEW_VIEWPORTS: readonly PreviewViewport[] = [
  { label: 'iPhone SE', width: 375, height: 667 },
  { label: 'iPhone 15', width: 390, height: 844 },
  { label: 'Pixel 8', width: 412, height: 915 },
  { label: 'iPad mini', width: 768, height: 1024 },
  { label: 'iPad landscape', width: 1024, height: 768 },
  { label: 'Laptop', width: 1280, height: 800 },
  { label: 'Desktop', width: 1920, height: 1080 },
];

export const DEFAULT_PREVIEW_BREAKPOINTS: readonly PreviewBreakpoint[] = [
  { label: 'sm', width: 640 },
  { label: 'md', width: 768 },
  { label: 'lg', width: 1024 },
  { label: 'xl', width: 1280 },
  { label: '2xl', width: 1536 },
];

export const DEFAULT_PREVIEW_THEMES: readonly PreviewTheme[] = ['light', 'dark'];

/** Height given to the `widths` presets. */
export const WIDTH_PRESET_HEIGHT = 900;

export const PREVIEW_CONFIG = new InjectionToken<PreviewConfig>('ligeirinho.previewConfig');

export function toPreviewTheme(themeParameter: string | null): PreviewTheme {
  return themeParameter === 'dark' ? 'dark' : 'light';
}

export function toPreviewConfig(registry: ScenarioRegistry, options: PreviewOptions): PreviewConfig {
  const widthPresets = (options.widths ?? []).map((width) => ({
    label: `${width} px`,
    width,
    height: WIDTH_PRESET_HEIGHT,
  }));
  return {
    registry,
    viewports: [...(options.viewports ?? DEFAULT_PREVIEW_VIEWPORTS), ...widthPresets],
    breakpoints: options.breakpoints ?? DEFAULT_PREVIEW_BREAKPOINTS,
    themes: options.themes ?? DEFAULT_PREVIEW_THEMES,
  };
}
