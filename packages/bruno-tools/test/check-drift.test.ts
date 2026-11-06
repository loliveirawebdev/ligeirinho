import { rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkDrift, formatDriftProblem, type DriftReport } from '../src/index.js';
import {
  CLEAN_COLLECTION,
  TASKS_OPENAPI,
  copyCleanCollection,
  httpRequestFile,
  removeTemporaryDirectories,
  writeCollectionFile,
} from './fixture-collections.js';

afterEach(removeTemporaryDirectories);

function messagesOf(report: DriftReport): string[] {
  return report.problems.map(formatDriftProblem);
}

describe('checkDrift', () => {
  it('reports nothing for a collection that mirrors the OpenAPI document', async () => {
    const report = await checkDrift({ openapi: TASKS_OPENAPI, collection: CLEAN_COLLECTION });

    expect(report.problems).toEqual([]);
    expect(report).toMatchObject({ operationCount: 6, requestCount: 7, flowRequestCount: 1 });
  });

  it('reports an operation without any request', async () => {
    const collection = await copyCleanCollection();
    await rm(path.join(collection, 'tasks', 'create-task.bru'));

    const report = await checkDrift({ openapi: TASKS_OPENAPI, collection });

    expect(messagesOf(report)).toEqual(['missing request: POST /tasks']);
  });

  it('does not count a request under flows/ as covering an operation', async () => {
    const collection = await copyCleanCollection();
    await rm(path.join(collection, 'tasks', 'create-task.bru'));

    const report = await checkDrift({ openapi: TASKS_OPENAPI, collection });

    expect(report.flowRequestCount).toBe(1);
    expect(messagesOf(report)).toContain('missing request: POST /tasks');
  });

  it('reports a request that matches no operation', async () => {
    const collection = await copyCleanCollection();
    await writeCollectionFile(collection, 'tasks/old.bru', httpRequestFile('delete', '{{baseUrl}}/tasks/:taskId'));

    const report = await checkDrift({ openapi: TASKS_OPENAPI, collection });

    expect(messagesOf(report)).toEqual([`orphan request: ${path.join(collection, 'tasks/old.bru')} → DELETE /tasks/{}`]);
  });

  it('requires requests under flows/ to match an operation, but never their folder', async () => {
    const collection = await copyCleanCollection();
    await writeCollectionFile(collection, 'flows/task-lifecycle/02-get.bru', httpRequestFile('get', '{{baseUrl}}/tasks/:id'));
    await writeCollectionFile(collection, 'flows/task-lifecycle/03-old.bru', httpRequestFile('get', '{{baseUrl}}/archive'));

    const report = await checkDrift({ openapi: TASKS_OPENAPI, collection });

    expect(messagesOf(report)).toEqual([
      `orphan request: ${path.join(collection, 'flows/task-lifecycle/03-old.bru')} → GET /archive`,
    ]);
  });

  it('reports a JSON body that does not parse', async () => {
    const collection = await copyCleanCollection();
    await writeCollectionFile(collection, 'tasks/comments/create-comment.bru', httpRequestFile('post', '{{baseUrl}}/tasks/:taskId/comments', '{ "text": '));

    const report = await checkDrift({ openapi: TASKS_OPENAPI, collection });

    expect(report.problems).toMatchObject([{ kind: 'invalid-json-body' }]);
    expect(messagesOf(report)[0]).toMatch(/^invalid body: .*create-comment\.bru → JSON does not parse/);
  });

  it('reports body: json without a body:json block', async () => {
    const collection = await copyCleanCollection();
    const request = httpRequestFile('post', '{{baseUrl}}/tasks/:taskId/comments').replace('body: none', 'body: json');
    await writeCollectionFile(collection, 'tasks/comments/create-comment.bru', request);

    const report = await checkDrift({ openapi: TASKS_OPENAPI, collection });

    expect(report.problems).toMatchObject([{ kind: 'invalid-json-body' }]);
  });

  it('reports every required property missing from the body, following $ref', async () => {
    const collection = await copyCleanCollection();
    await writeCollectionFile(collection, 'tasks/create-task.bru', httpRequestFile('post', '{{baseUrl}}/tasks', '{ "title": "x", "estimate": 1 }'));

    const report = await checkDrift({ openapi: TASKS_OPENAPI, collection });

    expect(messagesOf(report)).toEqual([
      `invalid body: ${path.join(collection, 'tasks/create-task.bru')} → missing required property "priority" (POST /tasks)`,
      `invalid body: ${path.join(collection, 'tasks/create-task.bru')} → missing required property "done" (POST /tasks)`,
    ]);
  });

  it('reports a JSON body sent to an operation without requestBody', async () => {
    const collection = await copyCleanCollection();
    await writeCollectionFile(collection, 'tasks/list-tasks.bru', httpRequestFile('get', '{{baseUrl}}/tasks', '{}'));

    const report = await checkDrift({ openapi: TASKS_OPENAPI, collection });

    expect(messagesOf(report)).toEqual([
      `invalid body: ${path.join(collection, 'tasks/list-tasks.bru')} → GET /tasks has no requestBody`,
    ]);
  });

  it('reports a request whose folder does not mirror the static URL segments', async () => {
    const collection = await copyCleanCollection();
    await rename(path.join(collection, 'tasks', 'comments', 'create-comment.bru'), path.join(collection, 'tasks', 'create-comment.bru'));

    const report = await checkDrift({ openapi: TASKS_OPENAPI, collection });

    expect(messagesOf(report)).toEqual([
      `wrong folder: ${path.join(collection, 'tasks/create-comment.bru')} → expected tasks/comments/ for POST /tasks/{taskId}/comments`,
    ]);
  });

  it('reports a request file that does not parse, without stopping the check', async () => {
    const collection = await copyCleanCollection();
    await writeCollectionFile(collection, 'tasks/broken.bru', 'meta {\n  name: broken\n');

    const report = await checkDrift({ openapi: TASKS_OPENAPI, collection });

    expect(messagesOf(report)).toEqual([
      `unreadable request: ${path.join(collection, 'tasks/broken.bru')} → line 1: block "meta" is never closed with "}"`,
    ]);
  });
});
