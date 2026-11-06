export interface BruEntry {
  readonly key: string;
  readonly value: string;
  /** Bruno marks a disabled entry with a leading `~`. */
  readonly enabled: boolean;
}

export interface BruDictionaryBlock {
  readonly kind: 'dictionary';
  readonly name: string;
  readonly entries: readonly BruEntry[];
}

export interface BruTextBlock {
  readonly kind: 'text';
  readonly name: string;
  readonly content: string;
}

export interface BruListBlock {
  readonly kind: 'list';
  readonly name: string;
  readonly items: readonly string[];
}

export type BruBlock = BruDictionaryBlock | BruTextBlock | BruListBlock;

export interface BruDocument {
  readonly blocks: readonly BruBlock[];
}

export function findBlock(document: BruDocument, name: string): BruBlock | undefined {
  return document.blocks.find((block) => block.name === name);
}

export function findEntryValue(block: BruBlock | undefined, key: string): string | undefined {
  if (block?.kind !== 'dictionary') {
    return undefined;
  }
  return block.entries.find((entry) => entry.key === key && entry.enabled)?.value;
}
