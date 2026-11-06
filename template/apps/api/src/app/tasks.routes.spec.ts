import type { INestApplication } from '@nestjs/common';
import { createTestToken } from '@app/shared-auth/testing';
import { createTestTask, OTHER_OWNER_ID, TEST_OWNER_ID, type InMemoryTaskRepository } from '@app/tasks-application/testing';
import request from 'supertest';
import { createTestApp, httpServerOf, readProblem, readTask, readTaskIds } from '../testing/test-app';

// Who can and who can't call each route (rules/security.md): success, 401, 403 and, with an id, another owner's 404.
let app: INestApplication;
let taskRepository: InMemoryTaskRepository;
let readerToken: string;
let writerToken: string;
let tokenWithoutPermissions: string;

beforeAll(async () => {
  ({ app, taskRepository } = await createTestApp());
  readerToken = await createTestToken({ userId: TEST_OWNER_ID, permissions: ['tasks:read'] });
  writerToken = await createTestToken({ userId: TEST_OWNER_ID, permissions: ['tasks:read', 'tasks:write'] });
  tokenWithoutPermissions = await createTestToken({ userId: TEST_OWNER_ID, permissions: [] });
});

afterAll(async () => {
  await app.close();
});

const server = () => httpServerOf(app);

describe('GET /tasks', () => {
  it('lists the caller tasks for a reader', async () => {
    const ownTask = createTestTask({ id: '20000000-0000-4000-8000-000000000001' });
    await taskRepository.save(ownTask);
    await taskRepository.save(createTestTask({ id: '20000000-0000-4000-8000-000000000002', ownerId: OTHER_OWNER_ID }));
    const response = await request(server()).get('/tasks').auth(readerToken, { type: 'bearer' }).expect(200);
    expect(readTaskIds(response)).toContain(ownTask.id);
    expect(readTaskIds(response)).not.toContain('20000000-0000-4000-8000-000000000002');
  });

  it('answers 401 without a token', () => request(server()).get('/tasks').expect(401));

  it('answers 401 with a malformed token', () => request(server()).get('/tasks').auth('not-a-jwt', { type: 'bearer' }).expect(401));

  it('answers 403 without the read permission', () =>
    request(server()).get('/tasks').auth(tokenWithoutPermissions, { type: 'bearer' }).expect(403));

  it('rejects a limit above the maximum', () =>
    request(server()).get('/tasks?limit=500').auth(readerToken, { type: 'bearer' }).expect(400));
});

describe('POST /tasks', () => {
  it('creates a task and points to it', async () => {
    const response = await request(server())
      .post('/tasks')
      .auth(writerToken, { type: 'bearer' })
      .send({ title: 'Ship the template' })
      .expect(201);
    const createdTask = readTask(response);
    expect(response.headers['location']).toBe(`/tasks/${createdTask.id}`);
    expect(createdTask).toMatchObject({ title: 'Ship the template', completed: false });
  });

  it('answers 401 without a token', () => request(server()).post('/tasks').send({ title: 'x' }).expect(401));

  it('answers 403 for a reader', () =>
    request(server()).post('/tasks').auth(readerToken, { type: 'bearer' }).send({ title: 'x' }).expect(403));

  it('rejects unknown fields', () =>
    request(server()).post('/tasks').auth(writerToken, { type: 'bearer' }).send({ title: 'x', ownerId: OTHER_OWNER_ID }).expect(400));

  it('answers 422 with problem details for a blank title', async () => {
    const response = await request(server()).post('/tasks').auth(writerToken, { type: 'bearer' }).send({ title: '   ' }).expect(422);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(readProblem(response).type).toBe('https://errors.app.local/invalid-task-title');
  });
});

describe('GET /tasks/:taskId', () => {
  const taskId = '30000000-0000-4000-8000-000000000001';
  const otherOwnersTaskId = '30000000-0000-4000-8000-000000000002';

  beforeAll(async () => {
    await taskRepository.save(createTestTask({ id: taskId }));
    await taskRepository.save(createTestTask({ id: otherOwnersTaskId, ownerId: OTHER_OWNER_ID }));
  });

  it('returns the caller task', () =>
    request(server()).get(`/tasks/${taskId}`).auth(readerToken, { type: 'bearer' }).expect(200));

  it('answers 401 without a token', () => request(server()).get(`/tasks/${taskId}`).expect(401));

  it('answers 403 without the read permission', () =>
    request(server()).get(`/tasks/${taskId}`).auth(tokenWithoutPermissions, { type: 'bearer' }).expect(403));

  it("answers 404 for another owner's task", () =>
    request(server()).get(`/tasks/${otherOwnersTaskId}`).auth(readerToken, { type: 'bearer' }).expect(404));
});

describe('PATCH /tasks/:taskId', () => {
  const taskId = '40000000-0000-4000-8000-000000000001';
  const otherOwnersTaskId = '40000000-0000-4000-8000-000000000002';

  beforeAll(async () => {
    await taskRepository.save(createTestTask({ id: taskId }));
    await taskRepository.save(createTestTask({ id: otherOwnersTaskId, ownerId: OTHER_OWNER_ID }));
  });

  it('completes the caller task', async () => {
    const response = await request(server())
      .patch(`/tasks/${taskId}`)
      .auth(writerToken, { type: 'bearer' })
      .send({ completed: true })
      .expect(200);
    expect(readTask(response).completed).toBe(true);
  });

  it('answers 401 without a token', () => request(server()).patch(`/tasks/${taskId}`).send({ completed: true }).expect(401));

  it('answers 403 for a reader', () =>
    request(server()).patch(`/tasks/${taskId}`).auth(readerToken, { type: 'bearer' }).send({ completed: true }).expect(403));

  it("answers 404 for another owner's task", () =>
    request(server())
      .patch(`/tasks/${otherOwnersTaskId}`)
      .auth(writerToken, { type: 'bearer' })
      .send({ completed: true })
      .expect(404));
});

describe('GET /health', () => {
  it('is public', () => request(server()).get('/health').expect(200));
});
