import { Document, Spectral, type ISpectralDiagnostic } from '@stoplight/spectral-core';
import * as Parsers from '@stoplight/spectral-parsers';
import { ligeirinhoRuleset } from '../src/index.js';

type JsonObject = Record<string, unknown>;

export const problemResponse = {
  description: 'Problem',
  content: { 'application/problem+json': { schema: { type: 'object' } } },
};

const taskSchema = { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' } } };

export const paginationParameters = [
  { name: 'cursor', in: 'query', schema: { type: 'string' } },
  { name: 'limit', in: 'query', schema: { type: 'integer' } },
];

export const taskIdParameter = { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } };

export function listResponse(): JsonObject {
  const pageSchema = { type: 'object', properties: { items: { type: 'array', items: taskSchema } } };
  return { description: 'A page of tasks', content: { 'application/json': { schema: pageSchema } } };
}

export function createdResponse(withLocation: boolean): JsonObject {
  const headers = withLocation ? { Location: { schema: { type: 'string' } } } : {};
  return { description: 'Created', headers, content: { 'application/json': { schema: taskSchema } } };
}

/** A contract that follows every rule: list, create (201 + Location), read, and a cancellation sub-resource. */
export function goodPaths(): JsonObject {
  return {
    '/tasks': {
      get: { parameters: paginationParameters, responses: { '200': listResponse(), '400': problemResponse } },
      post: { responses: { '201': createdResponse(true), '422': problemResponse } },
    },
    '/tasks/{taskId}': {
      parameters: [taskIdParameter],
      get: { responses: { '200': { description: 'A task' }, '404': problemResponse } },
    },
    '/tasks/{taskId}/cancellations': {
      parameters: [taskIdParameter],
      post: { responses: { '204': { description: 'Cancelled' }, '409': problemResponse } },
    },
    '/ticket-types': { put: { responses: { '204': { description: 'Replaced' } } } },
  };
}

export function openApiDocument(paths: JsonObject): JsonObject {
  // eslint-disable-next-line id-denylist -- `info` is the OpenAPI field name.
  return { openapi: '3.1.0', info: { title: 'Tasks', version: '1.0.0' }, paths };
}

export async function lintPaths(paths: JsonObject): Promise<ISpectralDiagnostic[]> {
  const spectral = new Spectral();
  spectral.setRuleset(ligeirinhoRuleset);
  const document = new Document(JSON.stringify(openApiDocument(paths)), Parsers.Json, 'openapi.json');
  return spectral.run(document);
}

export function codesOf(diagnostics: readonly ISpectralDiagnostic[]): (string | number)[] {
  return diagnostics.map((diagnostic) => diagnostic.code);
}
