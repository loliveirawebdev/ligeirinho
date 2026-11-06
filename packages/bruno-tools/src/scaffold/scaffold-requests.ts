import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readCollection, type CollectionRequest } from '../collection/read-collection.js';
import { findUncoveredOperations } from '../drift/check-drift.js';
import type { HttpMethod } from '../http-method.js';
import type { ApiOperation } from '../openapi/api-operation.js';
import { loadApiOperations } from '../openapi/load-openapi.js';
import { expectedFolderFor } from '../paths/url-path.js';
import { renderRequest, requestFileName } from './render-request.js';

export interface ScaffoldSources {
  /** OpenAPI file path or http(s) URL. */
  readonly openapi: string;
  /** Bruno collection directory. */
  readonly collection: string;
}

export interface ScaffoldedRequest {
  readonly filePath: string;
  readonly method: HttpMethod;
  readonly path: string;
}

export interface ScaffoldResult {
  readonly created: readonly ScaffoldedRequest[];
  /** Operations without a request whose target file already exists (never overwritten). */
  readonly skipped: readonly ScaffoldedRequest[];
}

export async function scaffoldRequests(sources: ScaffoldSources): Promise<ScaffoldResult> {
  // Scaffolding is also how a collection starts, so the directory may not exist yet.
  await mkdir(sources.collection, { recursive: true });
  const [operations, requests] = await Promise.all([
    loadApiOperations(sources.openapi),
    readCollection(sources.collection),
  ]);
  return writeMissingRequests(sources.collection, findUncoveredOperations(operations, requests), requests);
}

async function writeMissingRequests(
  collectionDirectory: string,
  operations: readonly ApiOperation[],
  existingRequests: readonly CollectionRequest[],
): Promise<ScaffoldResult> {
  const created: ScaffoldedRequest[] = [];
  const skipped: ScaffoldedRequest[] = [];
  const requestCountByFolder = countRequestsByFolder(existingRequests);
  // Sequential on purpose: `seq` numbers depend on what was already written in the same folder.
  for (const operation of operations) {
    const folder = expectedFolderFor(operation.path);
    const sequence = (requestCountByFolder.get(folder) ?? 0) + 1;
    const scaffolded = describeTarget(collectionDirectory, folder, operation);
    const wasWritten = await writeNewFile(scaffolded.filePath, renderRequest(operation, sequence));
    (wasWritten ? created : skipped).push(scaffolded);
    if (wasWritten) {
      requestCountByFolder.set(folder, sequence);
    }
  }
  return { created, skipped };
}

function countRequestsByFolder(requests: readonly CollectionRequest[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const request of requests) {
    counts.set(request.folder, (counts.get(request.folder) ?? 0) + 1);
  }
  return counts;
}

function describeTarget(collectionDirectory: string, folder: string, operation: ApiOperation): ScaffoldedRequest {
  return {
    filePath: path.join(collectionDirectory, ...folder.split('/'), requestFileName(operation)),
    method: operation.method,
    path: operation.path,
  };
}

/** Writes only when the file does not exist yet; returns whether it wrote. */
async function writeNewFile(filePath: string, content: string): Promise<boolean> {
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await writeFile(filePath, content, { encoding: 'utf8', flag: 'wx' });
    return true;
  } catch (error) {
    if (isFileExistsError(error)) {
      return false;
    }
    throw error;
  }
}

function isFileExistsError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'EEXIST';
}
