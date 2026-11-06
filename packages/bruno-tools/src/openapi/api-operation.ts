import { InvalidOpenApiDocument } from '../errors.js';
import { HTTP_METHODS, type HttpMethod } from '../http-method.js';
import { normalizeOpenApiPath } from '../paths/url-path.js';
import { isJsonRecord, recordAt, type JsonRecord } from './json-record.js';
import { readRequestBody, type RequestBodyShape } from './request-body.js';

export interface ApiOperation {
  readonly method: HttpMethod;
  /** The path exactly as written in the OpenAPI document, e.g. `/tasks/{taskId}`. */
  readonly path: string;
  /** The comparable form, e.g. `/tasks/{}`. */
  readonly normalizedPath: string;
  readonly operationId: string | undefined;
  /** False only when the effective `security` is an empty list (`security: []`). */
  readonly requiresAuth: boolean;
  readonly requestBody: RequestBodyShape | undefined;
}

/** Validates the parsed document at the edge and turns it into the operations the tools work with. */
export function readApiOperations(document: unknown): ApiOperation[] {
  const validDocument = validateDocument(document);
  const paths = recordAt(validDocument, 'paths') ?? {};
  return Object.entries(paths).flatMap(([path, pathItem]) =>
    isJsonRecord(pathItem) ? readPathOperations(validDocument, path, pathItem) : [],
  );
}

function validateDocument(document: unknown): JsonRecord {
  if (!isJsonRecord(document)) {
    throw new InvalidOpenApiDocument('the document is not an object');
  }
  const version = document['openapi'];
  if (typeof version !== 'string' || !version.startsWith('3.')) {
    throw new InvalidOpenApiDocument('only OpenAPI 3.x is supported (missing or unsupported "openapi" field)');
  }
  return document;
}

function readPathOperations(document: JsonRecord, path: string, pathItem: JsonRecord): ApiOperation[] {
  return HTTP_METHODS.flatMap((method) => {
    const operation = recordAt(pathItem, method);
    return operation === undefined ? [] : [readOperation(document, { method, path, operation })];
  });
}

interface OperationLocation {
  readonly method: HttpMethod;
  readonly path: string;
  readonly operation: JsonRecord;
}

function readOperation(document: JsonRecord, location: OperationLocation): ApiOperation {
  const { method, path, operation } = location;
  const operationId = operation['operationId'];
  return {
    method,
    path,
    normalizedPath: normalizeOpenApiPath(path),
    operationId: typeof operationId === 'string' ? operationId : undefined,
    requiresAuth: requiresAuth(document, operation),
    requestBody: readRequestBody(document, operation['requestBody']),
  };
}

function requiresAuth(document: JsonRecord, operation: JsonRecord): boolean {
  const effectiveSecurity = 'security' in operation ? operation['security'] : document['security'];
  return !(Array.isArray(effectiveSecurity) && effectiveSecurity.length === 0);
}
