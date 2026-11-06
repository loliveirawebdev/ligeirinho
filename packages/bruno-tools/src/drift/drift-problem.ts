import type { HttpMethod } from '../http-method.js';

interface OperationReference {
  readonly method: HttpMethod;
  readonly path: string;
}

export interface MissingRequest {
  readonly kind: 'missing-request';
  readonly operation: OperationReference;
}

export interface OrphanRequest {
  readonly kind: 'orphan-request';
  readonly filePath: string;
  readonly method: HttpMethod;
  readonly normalizedPath: string;
}

export interface UnreadableRequest {
  readonly kind: 'unreadable-request';
  readonly filePath: string;
  readonly reason: string;
}

export interface WrongFolder {
  readonly kind: 'wrong-folder';
  readonly filePath: string;
  readonly operation: OperationReference;
  /** `/`-separated, relative to the collection, `''` for the root. */
  readonly expectedFolder: string;
}

export interface InvalidJsonBody {
  readonly kind: 'invalid-json-body';
  readonly filePath: string;
  readonly operation: OperationReference;
  readonly reason: string;
}

export interface MissingBodyProperty {
  readonly kind: 'missing-body-property';
  readonly filePath: string;
  readonly operation: OperationReference;
  readonly property: string;
}

export interface UnexpectedBody {
  readonly kind: 'unexpected-body';
  readonly filePath: string;
  readonly operation: OperationReference;
}

export type DriftProblem =
  | MissingRequest
  | OrphanRequest
  | UnreadableRequest
  | WrongFolder
  | InvalidJsonBody
  | MissingBodyProperty
  | UnexpectedBody;

export function formatDriftProblem(problem: DriftProblem): string {
  switch (problem.kind) {
    case 'missing-request':
      return `missing request: ${describe(problem.operation)}`;
    case 'orphan-request':
      return `orphan request: ${problem.filePath} → ${problem.method.toUpperCase()} ${problem.normalizedPath}`;
    case 'unreadable-request':
      return `unreadable request: ${problem.filePath} → ${problem.reason}`;
    case 'wrong-folder':
      return `wrong folder: ${problem.filePath} → expected ${folderLabel(problem.expectedFolder)} for ${describe(problem.operation)}`;
    case 'invalid-json-body':
      return `invalid body: ${problem.filePath} → ${problem.reason} (${describe(problem.operation)})`;
    case 'missing-body-property':
      return `invalid body: ${problem.filePath} → missing required property "${problem.property}" (${describe(problem.operation)})`;
    case 'unexpected-body':
      return `invalid body: ${problem.filePath} → ${describe(problem.operation)} has no requestBody`;
  }
}

function describe(operation: OperationReference): string {
  return `${operation.method.toUpperCase()} ${operation.path}`;
}

function folderLabel(folder: string): string {
  return folder === '' ? 'the collection root' : `${folder}/`;
}
