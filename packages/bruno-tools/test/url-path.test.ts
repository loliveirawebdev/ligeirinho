import { describe, expect, it } from 'vitest';
import { expectedFolderFor, normalizeOpenApiPath, normalizeRequestUrl } from '../src/index.js';

describe('normalizeRequestUrl', () => {
  it.each([
    ['{{baseUrl}}/tasks', '/tasks'],
    ['{{host}}{{apiPrefix}}/tasks', '/tasks'],
    ['{{baseUrl}}/tasks/', '/tasks'],
    ['{{baseUrl}}/tasks?page=1&size=2', '/tasks'],
    ['{{baseUrl}}/tasks#top', '/tasks'],
    ['{{baseUrl}}/tasks/:taskId/comments', '/tasks/{}/comments'],
    ['{{baseUrl}}/tasks/{{taskId}}', '/tasks/{}'],
    ['http://localhost:3000/tasks/:taskId', '/tasks/{}'],
    ['{{baseUrl}}', '/'],
    ['{{baseUrl}}/', '/'],
  ])('%s → %s', (url, expected) => {
    expect(normalizeRequestUrl(url)).toBe(expected);
  });
});

describe('normalizeOpenApiPath', () => {
  it('turns every {param} into {}', () => {
    expect(normalizeOpenApiPath('/tasks/{taskId}/comments/{commentId}')).toBe('/tasks/{}/comments/{}');
  });
});

describe('expectedFolderFor', () => {
  it.each([
    ['/tasks', 'tasks'],
    ['/tasks/{taskId}', 'tasks'],
    ['/tasks/{taskId}/comments', 'tasks/comments'],
    ['/tasks/{taskId}/comments/{commentId}', 'tasks/comments'],
    ['/', ''],
  ])('%s → "%s"', (openApiPath, expected) => {
    expect(expectedFolderFor(openApiPath)).toBe(expected);
  });
});
