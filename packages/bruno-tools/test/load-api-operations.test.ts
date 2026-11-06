import { readFile, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import {
  InvalidOpenApiDocument,
  OpenApiUnreadable,
  UnresolvableReference,
  loadApiOperations,
  readApiOperations,
} from '../src/index.js';
import { TASKS_OPENAPI, createTemporaryDirectory, removeTemporaryDirectories } from './fixture-collections.js';

const servers: Server[] = [];

afterEach(async () => {
  await removeTemporaryDirectories();
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
});

async function serveText(body: string, status = 200): Promise<string> {
  const server = createServer((_request, response) => {
    response.writeHead(status, { 'content-type': 'application/yaml' });
    response.end(body);
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${String(portOf(server.address()))}/openapi.yaml`;
}

function portOf(address: AddressInfo | string | null): number {
  if (address === null || typeof address === 'string') {
    throw new TypeError('the test server is not listening on a TCP port');
  }
  return address.port;
}

describe('loadApiOperations', () => {
  it('reads every operation of a YAML document', async () => {
    const operations = await loadApiOperations(TASKS_OPENAPI);

    expect(operations.map((operation) => `${operation.method} ${operation.path}`)).toEqual([
      'get /health',
      'get /tasks',
      'post /tasks',
      'get /tasks/{taskId}',
      'patch /tasks/{taskId}',
      'post /tasks/{taskId}/comments',
    ]);
  });

  it('reads a JSON document', async () => {
    const jsonFile = path.join(await createTemporaryDirectory(), 'openapi.json');
    const document: unknown = parseYaml(await readFile(TASKS_OPENAPI, 'utf8'));
    await writeFile(jsonFile, JSON.stringify(document), 'utf8');

    const operations = await loadApiOperations(jsonFile);

    expect(operations).toHaveLength(6);
  });

  it('fetches a document from a URL', async () => {
    const url = await serveText(await readFile(TASKS_OPENAPI, 'utf8'));

    const operations = await loadApiOperations(url);

    expect(operations).toHaveLength(6);
  });

  it('fails on an HTTP error status', async () => {
    const url = await serveText('not found', 404);

    await expect(loadApiOperations(url)).rejects.toThrow(OpenApiUnreadable);
  });

  it('fails on a missing file', async () => {
    await expect(loadApiOperations('/nowhere/openapi.yaml')).rejects.toThrow(OpenApiUnreadable);
  });

  it('marks operations with security: [] as not requiring auth and inherits root security otherwise', async () => {
    const operations = await loadApiOperations(TASKS_OPENAPI);

    expect(operations.filter((operation) => !operation.requiresAuth).map((operation) => operation.path)).toEqual([
      '/health',
    ]);
  });

  it('resolves $ref, enums and 3.1 type lists in the required body properties', async () => {
    const operations = await loadApiOperations(TASKS_OPENAPI);
    const createTask = operations.find((operation) => operation.operationId === 'createTask');

    expect(createTask?.requestBody?.requiredProperties).toEqual([
      { name: 'title', schemaType: 'string', enumValues: [] },
      { name: 'priority', schemaType: 'string', enumValues: ['low', 'medium', 'high'] },
      { name: 'estimate', schemaType: 'integer', enumValues: [] },
      { name: 'done', schemaType: 'boolean', enumValues: [] },
    ]);
  });

  it('resolves referenced requestBodies and merges allOf', async () => {
    const operations = await loadApiOperations(TASKS_OPENAPI);
    const updateTask = operations.find((operation) => operation.operationId === 'updateTask');

    expect(updateTask?.requestBody?.requiredProperties.map((property) => property.name)).toEqual(['status']);
  });

  it('has no requestBody when the operation declares none', async () => {
    const operations = await loadApiOperations(TASKS_OPENAPI);

    expect(operations.find((operation) => operation.operationId === 'listTasks')?.requestBody).toBeUndefined();
  });
});

describe('readApiOperations', () => {
  it('refuses documents that are not OpenAPI 3.x', () => {
    expect(() => readApiOperations({ swagger: '2.0', paths: {} })).toThrow(InvalidOpenApiDocument);
    expect(() => readApiOperations('text')).toThrow(InvalidOpenApiDocument);
  });

  it('fails on a $ref that points nowhere', () => {
    const document = {
      openapi: '3.0.3',
      paths: { '/tasks': { post: { requestBody: { $ref: '#/components/requestBodies/Missing' } } } },
    };

    expect(() => readApiOperations(document)).toThrow(UnresolvableReference);
  });
});
