import { describe, expect, test } from 'vitest';
import {
  codesOf,
  createdResponse,
  goodPaths,
  lintPaths,
  listResponse,
  paginationParameters,
  problemResponse,
  taskIdParameter,
} from './openapi-fixtures.js';

const noContent = { '204': { description: 'Done' } };

describe('a contract that follows every rule', () => {
  test('has no diagnostics', async () => {
    expect(await lintPaths(goodPaths())).toEqual([]);
  });
});

describe('ligeirinho-kebab-case-paths', () => {
  test.each(['/ticketTypes', '/ticket_types', '/tasks/{task_id}', '/tasks/{TaskId}'])('%s fails', async (pathKey) => {
    const diagnostics = await lintPaths({ [pathKey]: { put: { responses: noContent } } });
    expect(codesOf(diagnostics)).toEqual(['ligeirinho-kebab-case-paths']);
    expect(diagnostics[0]?.severity).toBe(0);
  });

  test('kebab-case segments and {camelCase} parameters pass', async () => {
    expect(await lintPaths({ '/v1/ticket-types/{ticketTypeId}': { put: { responses: noContent } } })).toEqual([]);
  });
});

describe('ligeirinho-no-verbs-in-paths', () => {
  test.each(['/registrations/{registrationId}/cancel', '/invites/send', '/users/reset-password', '/login'])(
    '%s fails',
    async (pathKey) => {
      const diagnostics = await lintPaths({ [pathKey]: { put: { responses: noContent } } });
      expect(codesOf(diagnostics)).toContain('ligeirinho-no-verbs-in-paths');
    },
  );

  test('nouns pass', async () => {
    const paths = { '/registrations/{registrationId}/cancellations': { put: { responses: noContent } } };
    expect(await lintPaths(paths)).toEqual([]);
  });
});

describe('ligeirinho-no-caller-names-in-paths', () => {
  test.each(['/admin/events', '/internal/events', '/back-office/events', '/web/events'])('%s fails', async (pathKey) => {
    const diagnostics = await lintPaths({ [pathKey]: { put: { responses: noContent } } });
    expect(codesOf(diagnostics)).toEqual(['ligeirinho-no-caller-names-in-paths']);
  });

  test('a segment that only contains a caller name passes', async () => {
    expect(await lintPaths({ '/public-holidays': { put: { responses: noContent } } })).toEqual([]);
  });
});

describe('ligeirinho-no-secrets-in-urls', () => {
  test.each(['token', 'apiKey', 'api-key', 'access_token', 'password', 'code', 'inviteToken'])(
    'a query parameter named %s fails',
    async (parameterName) => {
      const parameters = [{ name: parameterName, in: 'query', schema: { type: 'string' } }];
      const diagnostics = await lintPaths({ '/invites': { put: { parameters, responses: noContent } } });
      expect(codesOf(diagnostics)).toEqual(['ligeirinho-no-secrets-in-urls']);
    },
  );

  test('a secret path parameter fails', async () => {
    const parameters = [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }];
    const diagnostics = await lintPaths({ '/invites/{token}': { parameters, put: { responses: noContent } } });
    expect(codesOf(diagnostics)).toEqual(['ligeirinho-no-secrets-in-urls']);
  });

  test('a secret in a header passes', async () => {
    const parameters = [{ name: 'token', in: 'header', schema: { type: 'string' } }];
    expect(await lintPaths({ '/invites': { put: { parameters, responses: noContent } } })).toEqual([]);
  });
});

describe('ligeirinho-created-location', () => {
  test('a 201 without Location fails when the created resource is readable', async () => {
    const paths = goodPaths();
    paths['/tasks'] = { post: { responses: { '201': createdResponse(false) } } };
    const diagnostics = await lintPaths(paths);
    expect(codesOf(diagnostics)).toEqual(['ligeirinho-created-location']);
    expect(diagnostics[0]?.path).toEqual(['paths', '/tasks', 'post', 'responses', '201']);
  });

  test('a 201 without Location passes when there is no GET on the created resource', async () => {
    const paths = { '/exports': { post: { responses: { '201': createdResponse(false) } } } };
    expect(await lintPaths(paths)).toEqual([]);
  });
});

describe('ligeirinho-create-responds-201', () => {
  test('a POST on a collection answering 200 fails', async () => {
    const paths = { '/tasks': { post: { responses: { '200': createdResponse(false) } } } };
    expect(codesOf(await lintPaths(paths))).toEqual(['ligeirinho-create-responds-201']);
  });

  test('a POST on an item answering 200 passes', async () => {
    const paths = { '/tasks/{taskId}': { parameters: [taskIdParameter], post: { responses: { '200': { description: 'Ok' } } } } };
    expect(await lintPaths(paths)).toEqual([]);
  });
});

describe('ligeirinho-paginated-collections', () => {
  test('a collection GET without pagination fails', async () => {
    const paths = { '/tasks': { get: { responses: { '200': listResponse() } } } };
    expect(codesOf(await lintPaths(paths))).toEqual(['ligeirinho-paginated-collections']);
  });

  test('a cursor without a limit fails', async () => {
    const parameters = paginationParameters.filter((parameter) => parameter.name === 'cursor');
    const paths = { '/tasks': { get: { parameters, responses: { '200': listResponse() } } } };
    expect(codesOf(await lintPaths(paths))).toEqual(['ligeirinho-paginated-collections']);
  });

  test('a GET returning a bare array without pagination fails', async () => {
    const arrayResponse = { description: 'Tasks', content: { 'application/json': { schema: { type: 'array' } } } };
    const paths = { '/tasks': { get: { responses: { '200': arrayResponse } } } };
    expect(codesOf(await lintPaths(paths))).toEqual(['ligeirinho-paginated-collections']);
  });

  test('page and limit pass', async () => {
    const parameters = [
      { name: 'page', in: 'query', schema: { type: 'integer' } },
      { name: 'limit', in: 'query', schema: { type: 'integer' } },
    ];
    const paths = { '/tasks': { get: { parameters, responses: { '200': listResponse() } } } };
    expect(await lintPaths(paths)).toEqual([]);
  });
});

describe('ligeirinho-problem-details-errors', () => {
  test('an error response in application/json fails', async () => {
    const jsonError = { description: 'Not found', content: { 'application/json': { schema: { type: 'object' } } } };
    const paths = { '/tasks/{taskId}': { parameters: [taskIdParameter], delete: { responses: { ...noContent, '404': jsonError } } } };
    const diagnostics = await lintPaths(paths);
    expect(codesOf(diagnostics)).toEqual(['ligeirinho-problem-details-errors']);
  });

  test('an error response without a body fails', async () => {
    const paths = { '/tasks': { put: { responses: { ...noContent, '5XX': { description: 'Server error' } } } } };
    expect(codesOf(await lintPaths(paths))).toEqual(['ligeirinho-problem-details-errors']);
  });

  test('a Problem Details error passes', async () => {
    const paths = { '/tasks': { put: { responses: { ...noContent, '409': problemResponse } } } };
    expect(await lintPaths(paths)).toEqual([]);
  });
});

describe('exceptions by path prefix', () => {
  test.each(['/oauth2/token', '/health', '/health/ready', '/me', '/me/sessions/login', '/.well-known/jwks.json'])(
    '%s is skipped by every rule',
    async (pathKey) => {
      const parameters = [{ name: 'code', in: 'query', schema: { type: 'string' } }];
      const paths = { [pathKey]: { post: { parameters, responses: { '200': { description: 'Ok' }, '400': { description: 'Bad' } } } } };
      expect(await lintPaths(paths)).toEqual([]);
    },
  );

  test('a path that only starts like an exception is checked', async () => {
    const paths = { '/members': { post: { responses: { '200': { description: 'Ok' } } } } };
    expect(codesOf(await lintPaths(paths))).toEqual(['ligeirinho-create-responds-201']);
  });
});
