import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { readHttpRequest, type BruHttpRequest } from '../bru/http-request.js';
import { parseBruFile } from '../bru/parse-bru-file.js';
import { BrunoToolsError, CollectionUnreadable } from '../errors.js';

export const FLOWS_FOLDER = 'flows';
const ENVIRONMENTS_FOLDER = 'environments';
const NON_REQUEST_FILES = new Set(['collection.bru', 'folder.bru']);
const IGNORED_FOLDERS = new Set(['node_modules', '.git']);

interface RequestLocation {
  /** The collection directory joined with the relative path, for messages. */
  readonly filePath: string;
  /** Relative to the collection, `/`-separated. */
  readonly relativePath: string;
  /** Folder relative to the collection, `/`-separated, `''` for the root. */
  readonly folder: string;
  /** Lives under the top-level `flows/` folder. */
  readonly isFlow: boolean;
}

export interface ParsedCollectionRequest extends RequestLocation {
  readonly kind: 'request';
  readonly request: BruHttpRequest;
}

export interface UnreadableCollectionRequest extends RequestLocation {
  readonly kind: 'unreadable';
  readonly reason: string;
}

export type CollectionRequest = ParsedCollectionRequest | UnreadableCollectionRequest;

/** Reads every request `.bru` file of a collection (not environments, `collection.bru` or `folder.bru`). */
export async function readCollection(collectionDirectory: string): Promise<CollectionRequest[]> {
  const relativePaths = await listRequestFiles(collectionDirectory);
  return Promise.all(relativePaths.map((relativePath) => readCollectionRequest(collectionDirectory, relativePath)));
}

export async function listRequestFiles(collectionDirectory: string): Promise<string[]> {
  const entries = await readdir(collectionDirectory, { recursive: true }).catch((cause: unknown) => {
    throw new CollectionUnreadable(collectionDirectory, cause instanceof Error ? cause.message : String(cause));
  });
  return entries
    .map((entry) => entry.split(path.sep).join('/'))
    .filter(isRequestFile)
    .sort();
}

function isRequestFile(relativePath: string): boolean {
  const segments = relativePath.split('/');
  const fileName = segments.at(-1) ?? '';
  if (!fileName.endsWith('.bru') || NON_REQUEST_FILES.has(fileName)) {
    return false;
  }
  return segments[0] !== ENVIRONMENTS_FOLDER && !segments.some((segment) => IGNORED_FOLDERS.has(segment));
}

async function readCollectionRequest(collectionDirectory: string, relativePath: string): Promise<CollectionRequest> {
  const location = locate(collectionDirectory, relativePath);
  const content = await readFile(path.join(collectionDirectory, relativePath), 'utf8');
  try {
    return { kind: 'request', ...location, request: readHttpRequest(parseBruFile(content)) };
  } catch (error) {
    if (error instanceof BrunoToolsError) {
      return { kind: 'unreadable', ...location, reason: error.message };
    }
    throw error;
  }
}

function locate(collectionDirectory: string, relativePath: string): RequestLocation {
  const folder = path.posix.dirname(relativePath);
  return {
    filePath: path.join(collectionDirectory, relativePath),
    relativePath,
    folder: folder === '.' ? '' : folder,
    isFlow: relativePath.split('/')[0] === FLOWS_FOLDER,
  };
}
