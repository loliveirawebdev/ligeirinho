import { UnresolvableReference } from '../errors.js';
import { isJsonRecord, type JsonRecord } from './json-record.js';

const MAX_REFERENCE_HOPS = 32;

/** Follows local `$ref`s (`#/components/...`) until it reaches a value that is not a reference. */
export function resolveReference(document: JsonRecord, candidate: unknown): JsonRecord | undefined {
  let current = candidate;
  for (let hop = 0; hop < MAX_REFERENCE_HOPS; hop += 1) {
    if (!isJsonRecord(current)) {
      return undefined;
    }
    const reference = current['$ref'];
    if (typeof reference !== 'string') {
      return current;
    }
    current = followPointer(document, reference);
  }
  throw new UnresolvableReference('(reference cycle)');
}

function followPointer(document: JsonRecord, reference: string): unknown {
  if (!reference.startsWith('#/')) {
    throw new UnresolvableReference(reference);
  }
  const tokens = reference.slice(2).split('/').map(unescapePointerToken);
  let current: unknown = document;
  for (const token of tokens) {
    if (!isJsonRecord(current) || !(token in current)) {
      throw new UnresolvableReference(reference);
    }
    current = current[token];
  }
  return current;
}

function unescapePointerToken(token: string): string {
  return decodeURIComponent(token).replaceAll('~1', '/').replaceAll('~0', '~');
}
