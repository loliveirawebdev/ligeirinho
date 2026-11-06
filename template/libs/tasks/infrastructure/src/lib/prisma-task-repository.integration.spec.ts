import { createDatabaseClient, type DatabaseClient } from '@app/shared-database';
import { createTestTask, OTHER_OWNER_ID, TEST_OWNER_ID } from '@app/tasks-application/testing';
import { toTaskId } from '@app/tasks-domain';
import { PrismaTaskRepository } from './prisma-task-repository';

// Runs against the real test database (see `make test-integration`), never a mock.
const databaseUrl = process.env['DATABASE_URL'] ?? '';
let databaseClient: DatabaseClient;
let taskRepository: PrismaTaskRepository;

beforeAll(() => {
  databaseClient = createDatabaseClient(databaseUrl);
  taskRepository = new PrismaTaskRepository(databaseClient);
});

beforeEach(async () => {
  await databaseClient.task.deleteMany();
});

afterAll(async () => {
  await databaseClient.$disconnect();
});

describe('Prisma task repository', () => {
  it('saves and finds a task by owner', async () => {
    const task = createTestTask();
    await taskRepository.save(task);
    expect(await taskRepository.findOwnedTask(TEST_OWNER_ID, task.id)).toEqual(task);
  });

  it('does not find a task owned by someone else', async () => {
    const task = createTestTask({ ownerId: OTHER_OWNER_ID });
    await taskRepository.save(task);
    expect(await taskRepository.findOwnedTask(TEST_OWNER_ID, task.id)).toBeUndefined();
  });

  it('updates an existing task', async () => {
    const task = createTestTask();
    await taskRepository.save(task);
    const completedTask = { ...task, completedAt: new Date('2026-01-12T00:00:00Z') };
    await taskRepository.save(completedTask);
    expect(await taskRepository.findOwnedTask(TEST_OWNER_ID, task.id)).toEqual(completedTask);
  });

  it('pages newest first with a cursor', async () => {
    const taskIds = ['10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003'];
    for (const [index, taskId] of taskIds.entries()) {
      await taskRepository.save(createTestTask({ id: taskId, createdAt: new Date(Date.UTC(2026, 0, 1 + index)) }));
    }
    const firstPage = await taskRepository.listOwnedTasks(TEST_OWNER_ID, { cursor: undefined, limit: 2 });
    const secondPage = await taskRepository.listOwnedTasks(TEST_OWNER_ID, { cursor: firstPage.nextCursor, limit: 2 });
    expect(firstPage.items.map((task) => task.id)).toEqual([toTaskId(taskIds[2] ?? ''), toTaskId(taskIds[1] ?? '')]);
    expect(secondPage.items.map((task) => task.id)).toEqual([toTaskId(taskIds[0] ?? '')]);
    expect(secondPage.nextCursor).toBeUndefined();
  });
});
