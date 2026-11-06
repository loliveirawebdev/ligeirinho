import { readCollection, type CollectionRequest, type ParsedCollectionRequest } from '../collection/read-collection.js';
import type { ApiOperation } from '../openapi/api-operation.js';
import { loadApiOperations } from '../openapi/load-openapi.js';
import { isJsonRecord } from '../openapi/json-record.js';
import { expectedFolderFor, normalizeRequestUrl } from '../paths/url-path.js';
import type { DriftProblem } from './drift-problem.js';

export interface DriftReport {
  readonly problems: readonly DriftProblem[];
  readonly operationCount: number;
  readonly requestCount: number;
  readonly flowRequestCount: number;
}

export interface DriftSources {
  /** OpenAPI file path or http(s) URL. */
  readonly openapi: string;
  /** Bruno collection directory. */
  readonly collection: string;
}

// Bruno variables are not JSON; a number stands in for them so `"{{title}}"` and `{{count}}` both parse.
const BRUNO_VARIABLE = /\{\{[^}]*\}\}/g;
const VARIABLE_STAND_IN = '0';

export async function checkDrift(sources: DriftSources): Promise<DriftReport> {
  const [operations, requests] = await Promise.all([
    loadApiOperations(sources.openapi),
    readCollection(sources.collection),
  ]);
  return compareCollection(operations, requests);
}

/** Compares a collection with the operations of an OpenAPI document. */
export function compareCollection(
  operations: readonly ApiOperation[],
  requests: readonly CollectionRequest[],
): DriftReport {
  const parsedRequests = requests.filter((request) => request.kind === 'request');
  const problems: DriftProblem[] = [
    ...findMissingRequests(operations, parsedRequests),
    ...requests.flatMap((request) => checkRequest(operations, request)),
  ];
  return {
    problems,
    operationCount: operations.length,
    requestCount: requests.length,
    flowRequestCount: requests.filter((request) => request.isFlow).length,
  };
}

/** Operations no request outside `flows/` covers. */
export function findUncoveredOperations(
  operations: readonly ApiOperation[],
  requests: readonly CollectionRequest[],
): ApiOperation[] {
  const coveredKeys = new Set(
    requests
      .filter((request) => request.kind === 'request')
      .filter((request) => !request.isFlow)
      .map(requestKey),
  );
  return operations.filter((operation) => !coveredKeys.has(operationKey(operation)));
}

function findMissingRequests(
  operations: readonly ApiOperation[],
  requests: readonly ParsedCollectionRequest[],
): DriftProblem[] {
  return findUncoveredOperations(operations, requests).map((operation) => ({
    kind: 'missing-request',
    operation: { method: operation.method, path: operation.path },
  }));
}

function checkRequest(operations: readonly ApiOperation[], request: CollectionRequest): DriftProblem[] {
  if (request.kind === 'unreadable') {
    return [{ kind: 'unreadable-request', filePath: request.filePath, reason: request.reason }];
  }
  const operation = operations.find((candidate) => operationKey(candidate) === requestKey(request));
  if (operation === undefined) {
    return [orphanProblem(request)];
  }
  return [...checkFolder(operation, request), ...checkBody(operation, request)];
}

function orphanProblem(request: ParsedCollectionRequest): DriftProblem {
  return {
    kind: 'orphan-request',
    filePath: request.filePath,
    method: request.request.method,
    normalizedPath: normalizeRequestUrl(request.request.url),
  };
}

function checkFolder(operation: ApiOperation, request: ParsedCollectionRequest): DriftProblem[] {
  const expectedFolder = expectedFolderFor(operation.path);
  if (request.isFlow || request.folder === expectedFolder) {
    return [];
  }
  return [{ kind: 'wrong-folder', filePath: request.filePath, operation: referenceTo(operation), expectedFolder }];
}

function checkBody(operation: ApiOperation, request: ParsedCollectionRequest): DriftProblem[] {
  if (request.request.bodyMode !== 'json') {
    return [];
  }
  const base = { filePath: request.filePath, operation: referenceTo(operation) };
  if (operation.requestBody === undefined) {
    return [{ kind: 'unexpected-body', ...base }];
  }
  const parsed = parseJsonBody(request.request.jsonBody ?? '');
  if (parsed.kind === 'invalid') {
    return [{ kind: 'invalid-json-body', ...base, reason: parsed.reason }];
  }
  const requiredNames = operation.requestBody.requiredProperties.map((property) => property.name);
  if (requiredNames.length > 0 && !isJsonRecord(parsed.body)) {
    return [{ kind: 'invalid-json-body', ...base, reason: 'body is not a JSON object' }];
  }
  const presentNames = isJsonRecord(parsed.body) ? Object.keys(parsed.body) : [];
  return requiredNames
    .filter((name) => !presentNames.includes(name))
    .map((property) => ({ kind: 'missing-body-property', ...base, property }));
}

type ParsedJsonBody = { readonly kind: 'valid'; readonly body: unknown } | { readonly kind: 'invalid'; readonly reason: string };

function parseJsonBody(jsonBody: string): ParsedJsonBody {
  if (jsonBody.trim() === '') {
    return { kind: 'invalid', reason: 'body: json but the body:json block is missing or empty' };
  }
  try {
    const body: unknown = JSON.parse(jsonBody.replace(BRUNO_VARIABLE, VARIABLE_STAND_IN));
    return { kind: 'valid', body };
  } catch (error) {
    return { kind: 'invalid', reason: `JSON does not parse (${error instanceof Error ? error.message : String(error)})` };
  }
}

function operationKey(operation: ApiOperation): string {
  return `${operation.method} ${operation.normalizedPath}`;
}

function requestKey(request: ParsedCollectionRequest): string {
  return `${request.request.method} ${normalizeRequestUrl(request.request.url)}`;
}

function referenceTo(operation: ApiOperation): { method: ApiOperation['method']; path: string } {
  return { method: operation.method, path: operation.path };
}
