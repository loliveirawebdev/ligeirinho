import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkDrift, findBlock, parseBruFile, readHttpRequest, scaffoldRequests } from '../src/index.js';
import {
  TASKS_OPENAPI,
  copyCleanCollection,
  createTemporaryDirectory,
  removeTemporaryDirectories,
} from './fixture-collections.js';

afterEach(removeTemporaryDirectories);

async function emptyCollection(): Promise<string> {
  return path.join(await createTemporaryDirectory(), 'bruno');
}

describe('scaffoldRequests', () => {
  it('creates one request per operation, in the folder the layout rule requires', async () => {
    const collection = await emptyCollection();

    const result = await scaffoldRequests({ openapi: TASKS_OPENAPI, collection });

    expect(result.skipped).toEqual([]);
    expect(result.created.map((request) => path.relative(collection, request.filePath))).toEqual([
      path.join('health', 'get-health.bru'),
      path.join('tasks', 'list-tasks.bru'),
      path.join('tasks', 'create-task.bru'),
      path.join('tasks', 'get-task.bru'),
      path.join('tasks', 'update-task.bru'),
      path.join('tasks', 'comments', 'post-tasks-task-id-comments.bru'),
    ]);
  });

  it('produces a collection that passes the drift check', async () => {
    const collection = await emptyCollection();

    await scaffoldRequests({ openapi: TASKS_OPENAPI, collection });

    const report = await checkDrift({ openapi: TASKS_OPENAPI, collection });
    expect(report.problems).toEqual([]);
  });

  it('writes bearer auth and a body skeleton with placeholders by type', async () => {
    const collection = await emptyCollection();

    await scaffoldRequests({ openapi: TASKS_OPENAPI, collection });

    expect(await readFile(path.join(collection, 'tasks', 'create-task.bru'), 'utf8')).toBe(
      [
        'meta {',
        '  name: createTask',
        '  type: http',
        '  seq: 2',
        '}',
        '',
        'post {',
        '  url: {{baseUrl}}/tasks',
        '  body: json',
        '  auth: bearer',
        '}',
        '',
        'auth:bearer {',
        '  token: {{token}}',
        '}',
        '',
        'body:json {',
        '  {',
        '    "title": "",',
        '    "priority": "low",',
        '    "estimate": 0,',
        '    "done": false',
        '  }',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('skips auth for operations with security: [] and writes path parameters', async () => {
    const collection = await emptyCollection();

    await scaffoldRequests({ openapi: TASKS_OPENAPI, collection });

    const health = parseBruFile(await readFile(path.join(collection, 'health', 'get-health.bru'), 'utf8'));
    expect(readHttpRequest(health)).toMatchObject({ authMode: 'none', bodyMode: 'none' });
    expect(findBlock(health, 'auth:bearer')).toBeUndefined();
    const getTask = parseBruFile(await readFile(path.join(collection, 'tasks', 'get-task.bru'), 'utf8'));
    expect(readHttpRequest(getTask).url).toBe('{{baseUrl}}/tasks/:taskId');
    expect(findBlock(getTask, 'params:path')).toMatchObject({ entries: [{ key: 'taskId', value: '' }] });
  });

  it('only creates requests for operations that have none, numbering after existing ones', async () => {
    const collection = await copyCleanCollection();
    await rm(path.join(collection, 'tasks', 'update-task.bru'));

    const result = await scaffoldRequests({ openapi: TASKS_OPENAPI, collection });

    expect(result.created).toEqual([
      { filePath: path.join(collection, 'tasks', 'update-task.bru'), method: 'patch', path: '/tasks/{taskId}' },
    ]);
    const updateTask = parseBruFile(await readFile(path.join(collection, 'tasks', 'update-task.bru'), 'utf8'));
    expect(findBlock(updateTask, 'meta')).toMatchObject({ entries: [{}, {}, { key: 'seq', value: '4' }] });
  });

  it('never overwrites an existing file, even when it holds another request', async () => {
    const collection = await copyCleanCollection();
    const target = path.join(collection, 'tasks', 'update-task.bru');
    const handWritten = 'meta {\n  name: hand written\n}\n';
    await writeFile(target, handWritten, 'utf8');

    const result = await scaffoldRequests({ openapi: TASKS_OPENAPI, collection });

    expect(result.created).toEqual([]);
    expect(result.skipped).toEqual([{ filePath: target, method: 'patch', path: '/tasks/{taskId}' }]);
    expect(await readFile(target, 'utf8')).toBe(handWritten);
  });

  it('creates nothing on a collection that is already complete', async () => {
    const collection = await copyCleanCollection();

    const result = await scaffoldRequests({ openapi: TASKS_OPENAPI, collection });

    expect(result).toEqual({ created: [], skipped: [] });
  });
});
