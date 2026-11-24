import { readFileSync } from 'node:fs';
import path from 'node:path';

/** The `copy` section of `.ligeirinho.yml` (rules/copy.md). */
export interface CopyConfig {
  /** The locale copy is written in first. */
  readonly source: string;
  /** Every locale the product ships, the source included. */
  readonly locales: readonly string[];
}

const DEFAULT_LOCALE = 'en';

/** `key: value  # comment` lines inside the `section:` block of a two-level YAML file. */
function readSection(yaml: string, section: string): Map<string, string> {
  const values = new Map<string, string>();
  let inSection = false;
  for (const line of yaml.split('\n')) {
    const withoutComment = line.replace(/\s+#.*$/, '');
    if (/^\S/.test(withoutComment)) {
      inSection = withoutComment.trim() === `${section}:`;
      continue;
    }
    const entry = /^\s+([\w-]+):\s*(.*)$/.exec(withoutComment);
    if (inSection && entry !== null) {
      values.set(entry[1] ?? '', (entry[2] ?? '').trim());
    }
  }
  return values;
}

function splitList(value: string | undefined): string[] {
  return (value ?? '')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
    .filter((item) => item !== '');
}

/**
 * Reads `copy.source` and `copy.locales` from `.ligeirinho.yml` in `rootDir`, so the lint and the project share one
 * list. Without the file or the section: English only.
 */
export function readCopyConfig(rootDir: string): CopyConfig {
  let yaml = '';
  try {
    yaml = readFileSync(path.join(rootDir, '.ligeirinho.yml'), 'utf8');
  } catch {
    // No config file: the defaults below.
  }
  const section = readSection(yaml, 'copy');
  const locales = splitList(section.get('locales'));
  const source = section.get('source') ?? locales[0] ?? DEFAULT_LOCALE;
  return { source, locales: locales.length > 0 ? locales : [source] };
}
