import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BruSyntaxError, MissingMethodBlock, findBlock, parseBruFile, readHttpRequest } from '../src/index.js';
import { CLEAN_COLLECTION } from './fixture-collections.js';

describe('parseBruFile', () => {
  it('reads dictionary blocks with their entries in order', () => {
    const document = parseBruFile('meta {\n  name: Get task\n  type: http\n  seq: 3\n}\n');

    expect(document.blocks).toEqual([
      {
        kind: 'dictionary',
        name: 'meta',
        entries: [
          { key: 'name', value: 'Get task', enabled: true },
          { key: 'type', value: 'http', enabled: true },
          { key: 'seq', value: '3', enabled: true },
        ],
      },
    ]);
  });

  it('keeps everything after the first colon as the value', () => {
    const document = parseBruFile('get {\n  url: {{baseUrl}}/tasks?from=10:00\n}\n');

    expect(findBlock(document, 'get')).toMatchObject({
      entries: [{ key: 'url', value: '{{baseUrl}}/tasks?from=10:00' }],
    });
  });

  it('marks entries starting with ~ as disabled', () => {
    const document = parseBruFile('params:query {\n  page: 1\n  ~status: open\n}\n');

    expect(findBlock(document, 'params:query')).toMatchObject({
      entries: [
        { key: 'page', value: '1', enabled: true },
        { key: 'status', value: 'open', enabled: false },
      ],
    });
  });

  it('reads an entry with an empty value', () => {
    const document = parseBruFile('params:path {\n  taskId: \n}\n');

    expect(findBlock(document, 'params:path')).toMatchObject({ entries: [{ key: 'taskId', value: '' }] });
  });

  it('reads quoted keys', () => {
    const document = parseBruFile('headers {\n  "x-trace:id": abc\n}\n');

    expect(findBlock(document, 'headers')).toMatchObject({ entries: [{ key: 'x-trace:id', value: 'abc' }] });
  });

  it("reads multiline ''' values", () => {
    const document = parseBruFile("headers {\n  note: '''\n    first line\n    second line\n  '''\n  next: 1\n}\n");

    expect(findBlock(document, 'headers')).toMatchObject({
      entries: [
        { key: 'note', value: 'first line\nsecond line' },
        { key: 'next', value: '1' },
      ],
    });
  });

  it('keeps body:json as dedented text, nested braces included', () => {
    const document = parseBruFile('body:json {\n  {\n    "title": "x",\n    "tags": {}\n  }\n}\n');

    expect(findBlock(document, 'body:json')).toEqual({
      kind: 'text',
      name: 'body:json',
      content: '{\n  "title": "x",\n  "tags": {}\n}',
    });
  });

  it('keeps scripts and docs as text', () => {
    const document = parseBruFile('script:pre-request {\n  if (x) {\n    y();\n  }\n}\n\ndocs {\n  # Title\n}\n');

    expect(findBlock(document, 'script:pre-request')).toMatchObject({ kind: 'text', content: 'if (x) {\n  y();\n}' });
    expect(findBlock(document, 'docs')).toMatchObject({ kind: 'text', content: '# Title' });
  });

  it('reads list blocks such as vars:secret', () => {
    const document = parseBruFile('vars:secret [\n  token,\n  password\n]\n');

    expect(findBlock(document, 'vars:secret')).toEqual({ kind: 'list', name: 'vars:secret', items: ['token', 'password'] });
  });

  it('reads blocks opened and closed on the same line', () => {
    const document = parseBruFile('headers {}\n');

    expect(findBlock(document, 'headers')).toEqual({ kind: 'dictionary', name: 'headers', entries: [] });
  });

  it('accepts Windows line endings', () => {
    const document = parseBruFile('meta {\r\n  name: x\r\n}\r\n');

    expect(findBlock(document, 'meta')).toMatchObject({ entries: [{ key: 'name', value: 'x' }] });
  });

  it('fails with the line number on an unclosed block', () => {
    expect(() => parseBruFile('meta {\n  name: x\n\nget {\n  url: /x\n')).toThrow(BruSyntaxError);
    expect(() => parseBruFile('\nmeta {\n  name: x\n')).toThrow('line 2: block "meta" is never closed with "}"');
  });

  it('fails on text outside a block', () => {
    expect(() => parseBruFile('name: x\n')).toThrow('line 1: expected a block header');
  });

  it('fails on a dictionary line without a key', () => {
    expect(() => parseBruFile('meta {\n  just text\n}\n')).toThrow('line 2: expected "key: value"');
  });
});

describe('readHttpRequest', () => {
  it('reads method, url, body mode, auth mode and JSON body of a real request file', async () => {
    const content = await readFile(path.join(CLEAN_COLLECTION, 'tasks', 'create-task.bru'), 'utf8');

    const request = readHttpRequest(parseBruFile(content));

    expect(request).toMatchObject({ name: 'Create task', method: 'post', url: '{{baseUrl}}/tasks' });
    expect(request).toMatchObject({ bodyMode: 'json', authMode: 'bearer' });
    expect(request.jsonBody).toContain('"priority": "high"');
  });

  it('defaults body and auth to none', () => {
    const request = readHttpRequest(parseBruFile('delete {\n  url: /tasks/1\n}\n'));

    expect(request).toMatchObject({ method: 'delete', bodyMode: 'none', authMode: 'none', jsonBody: undefined });
  });

  it('fails when there is no method block', () => {
    expect(() => readHttpRequest(parseBruFile('meta {\n  name: x\n}\n'))).toThrow(MissingMethodBlock);
  });
});
