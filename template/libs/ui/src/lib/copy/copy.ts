import { LOCALE_ID, inject } from '@angular/core';

/**
 * rules/copy.md. Every string a screen shows lives in a `*.copy.ts` file, one object per locale, under one key per
 * meaning. The lint (`@ligeirinho/copy-text`) checks that every locale has every key and the same placeholders.
 */

/** Forms of a count, by the locale's plural category (`one`, `few`, `many`, `other`…). `other` is required. */
export interface PluralForms {
  readonly zero?: string;
  readonly one?: string;
  readonly two?: string;
  readonly few?: string;
  readonly many?: string;
  readonly other: string;
}

/** A locale's texts: strings with `{placeholders}`, plural forms, or groups of either. */
export interface CopyText {
  readonly [key: string]: string | PluralForms | CopyText;
}

/** The copy of one screen or area, by locale: `{ en: {...}, 'pt-BR': {...} }`. The first locale is the source. */
export type CopyCatalog<Text extends CopyText> = Readonly<Record<string, Text>>;

/** The texts of one locale, with the locale itself (plurals and dates depend on it). */
export interface LocalizedCopy<Text extends CopyText> {
  readonly locale: string;
  readonly text: Text;
}

/** Declares a copy catalog. The call is what the lint looks for, so every `*.copy.ts` goes through it. */
export function defineCopy<const Locale extends string, Text extends CopyText>(
  catalog: Readonly<Record<Locale, Text>>,
): Readonly<Record<Locale, Text>> {
  return catalog;
}

class EmptyCopyCatalog extends Error {
  override readonly name = 'EmptyCopyCatalog';

  constructor() {
    super('A copy catalog needs at least one locale.');
  }
}

/** The locale's texts: an exact match (`pt-BR`), then the language (`pt`), then the source (the first locale). */
export function selectCopy<Text extends CopyText>(catalog: CopyCatalog<Text>, locale: string): LocalizedCopy<Text> {
  const locales = Object.keys(catalog);
  const language = locale.split('-')[0]?.toLowerCase() ?? '';
  const chosen =
    locales.find((candidate) => candidate.toLowerCase() === locale.toLowerCase()) ??
    locales.find((candidate) => candidate.split('-')[0]?.toLowerCase() === language) ??
    locales[0];
  const text = chosen === undefined ? undefined : catalog[chosen];
  if (chosen === undefined || text === undefined) {
    throw new EmptyCopyCatalog();
  }
  return { locale: chosen, text };
}

/** For pages: the copy in the app's `LOCALE_ID`, which the view-model then receives. */
export function injectCopy<Text extends CopyText>(catalog: CopyCatalog<Text>): LocalizedCopy<Text> {
  return selectCopy(catalog, inject(LOCALE_ID));
}

/** Fills `{name}` placeholders: `formatText('Complete “{title}”', { title })`. */
export function formatText(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = values[name];
    return value === undefined ? placeholder : String(value);
  });
}

/** The form for `count` in `locale`, with `{count}` filled in: `pluralText(forms, 2, 'en')` → `2 open tasks`. */
export function pluralText(forms: PluralForms, count: number, locale: string): string {
  const category = new Intl.PluralRules(locale).select(count);
  const form = (category === 'other' ? undefined : forms[category]) ?? forms.other;
  return formatText(form, { count: new Intl.NumberFormat(locale).format(count) });
}
