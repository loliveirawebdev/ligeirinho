import { BruSyntaxError } from '../errors.js';
import type { BruBlock, BruDocument, BruEntry } from './bru-document.js';

// Grammar reference: https://docs.usebruno.com/bru-lang/overview
const TEXT_BLOCK_NAMES = new Set([
  'docs',
  'tests',
  'body:json',
  'body:text',
  'body:xml',
  'body:sparql',
  'body:graphql',
  'body:graphql:vars',
]);
const TEXT_BLOCK_PREFIXES = ['script:'];
const BLOCK_HEADER = /^([A-Za-z][\w:-]*)\s*([{[])\s*(\}|\])?\s*$/;
const MULTILINE_MARKER = "'''";
const BLOCK_INDENT = '  ';

interface BlockHeader {
  readonly name: string;
  readonly closing: '}' | ']';
  readonly closedOnSameLine: boolean;
}

interface RawBlock {
  readonly header: BlockHeader;
  readonly bodyLines: readonly string[];
  readonly firstBodyLineNumber: number;
  readonly nextLineIndex: number;
}

export function parseBruFile(content: string): BruDocument {
  const lines = content.split(/\r?\n/);
  const blocks: BruBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (line.trim() === '') {
      index += 1;
      continue;
    }
    const rawBlock = readRawBlock(lines, index);
    blocks.push(buildBlock(rawBlock));
    index = rawBlock.nextLineIndex;
  }
  return { blocks };
}

function readRawBlock(lines: readonly string[], headerIndex: number): RawBlock {
  const header = parseBlockHeader(lines[headerIndex] ?? '', headerIndex + 1);
  const firstBodyIndex = headerIndex + 1;
  if (header.closedOnSameLine) {
    return { header, bodyLines: [], firstBodyLineNumber: firstBodyIndex + 1, nextLineIndex: firstBodyIndex };
  }
  const closingIndex = lines.indexOf(header.closing, firstBodyIndex);
  if (closingIndex === -1) {
    throw new BruSyntaxError(headerIndex + 1, `block "${header.name}" is never closed with "${header.closing}"`);
  }
  return {
    header,
    bodyLines: lines.slice(firstBodyIndex, closingIndex),
    firstBodyLineNumber: firstBodyIndex + 1,
    nextLineIndex: closingIndex + 1,
  };
}

function parseBlockHeader(line: string, lineNumber: number): BlockHeader {
  const match = BLOCK_HEADER.exec(line);
  const name = match?.[1];
  const opening = match?.[2];
  if (name === undefined || opening === undefined) {
    throw new BruSyntaxError(lineNumber, `expected a block header like "name {", got "${line.trim()}"`);
  }
  return { name, closing: opening === '{' ? '}' : ']', closedOnSameLine: match?.[3] !== undefined };
}

function buildBlock(rawBlock: RawBlock): BruBlock {
  const { name, closing } = rawBlock.header;
  if (closing === ']') {
    return { kind: 'list', name, items: parseListItems(rawBlock.bodyLines) };
  }
  if (isTextBlock(name)) {
    return { kind: 'text', name, content: dedent(rawBlock.bodyLines, BLOCK_INDENT) };
  }
  return { kind: 'dictionary', name, entries: parseEntries(rawBlock.bodyLines, rawBlock.firstBodyLineNumber) };
}

function isTextBlock(name: string): boolean {
  return TEXT_BLOCK_NAMES.has(name) || TEXT_BLOCK_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function parseListItems(bodyLines: readonly string[]): string[] {
  return bodyLines.map((line) => line.trim().replace(/,$/, '')).filter((itemName) => itemName !== '');
}

function parseEntries(bodyLines: readonly string[], firstLineNumber: number): BruEntry[] {
  const entries: BruEntry[] = [];
  let index = 0;
  while (index < bodyLines.length) {
    const line = bodyLines[index] ?? '';
    index += 1;
    if (line.trim() === '') {
      continue;
    }
    const entry = parseEntryLine(line, firstLineNumber + index - 1);
    if (entry.value !== MULTILINE_MARKER) {
      entries.push(entry);
      continue;
    }
    const multilineEnd = findMultilineEnd(bodyLines, index, firstLineNumber + index - 1);
    entries.push({ ...entry, value: dedent(bodyLines.slice(index, multilineEnd), BLOCK_INDENT + BLOCK_INDENT) });
    index = multilineEnd + 1;
  }
  return entries;
}

function parseEntryLine(line: string, lineNumber: number): BruEntry {
  const trimmed = line.trim();
  const enabled = !trimmed.startsWith('~');
  const withoutMarker = enabled ? trimmed : trimmed.slice(1);
  const separatorIndex = findKeySeparator(withoutMarker);
  if (separatorIndex <= 0) {
    throw new BruSyntaxError(lineNumber, `expected "key: value", got "${trimmed}"`);
  }
  const key = unquoteKey(withoutMarker.slice(0, separatorIndex).trim());
  const value = withoutMarker.slice(separatorIndex + 1).trim();
  return { key, value, enabled };
}

function findKeySeparator(text: string): number {
  if (!text.startsWith('"')) {
    return text.indexOf(':');
  }
  const closingQuoteIndex = text.indexOf('"', 1);
  return closingQuoteIndex === -1 ? -1 : text.indexOf(':', closingQuoteIndex);
}

function unquoteKey(key: string): string {
  return key.startsWith('"') && key.endsWith('"') && key.length >= 2 ? key.slice(1, -1) : key;
}

function findMultilineEnd(bodyLines: readonly string[], startIndex: number, openingLineNumber: number): number {
  const endIndex = bodyLines.findIndex((line, index) => index >= startIndex && line.trim() === MULTILINE_MARKER);
  if (endIndex === -1) {
    throw new BruSyntaxError(openingLineNumber, `multiline value is never closed with ${MULTILINE_MARKER}`);
  }
  return endIndex;
}

function dedent(lines: readonly string[], indent: string): string {
  return lines.map((line) => (line.startsWith(indent) ? line.slice(indent.length) : line.trimStart())).join('\n');
}
