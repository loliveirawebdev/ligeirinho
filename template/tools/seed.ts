// Fills the dev database with the same example data the tests and the previewer use, and writes
// test tokens to .ligeirinho/seed.json for Bruno (`make bruno-env`) and for signing in by hand.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createTestToken } from '@app/shared-auth/testing';
import { createDatabaseClient } from '@app/shared-database';
import { createTestTask, OTHER_OWNER_ID, TEST_OWNER_ID } from '@app/tasks-application/testing';
import { PrismaTaskRepository } from '@app/tasks-infrastructure';
import { SAMPLE_TASKS } from '../libs/tasks/web/src/lib/task-list/task-list.sample-tasks';

class MissingVariable extends Error {
  override readonly name = 'MissingVariable';

  constructor(variableName: string) {
    super(`${variableName} is required (it comes from .env inside the toolbox)`);
  }
}

function requireVariable(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new MissingVariable(name);
  }
  return value;
}

async function seed(): Promise<void> {
  const tokenSettings = {
    secret: requireVariable('TOKEN_SECRET'),
    issuer: requireVariable('TOKEN_ISSUER'),
    audience: requireVariable('TOKEN_AUDIENCE'),
  };
  const databaseClient = createDatabaseClient(requireVariable('DATABASE_URL'));
  const taskRepository = new PrismaTaskRepository(databaseClient);
  for (const sampleTask of SAMPLE_TASKS) {
    await taskRepository.save(
      createTestTask({
        id: sampleTask.id,
        title: sampleTask.title,
        createdAt: new Date(sampleTask.createdAt),
        ...(sampleTask.completed ? { completedAt: new Date(sampleTask.createdAt) } : {}),
      }),
    );
  }
  await databaseClient.$disconnect();

  const seedValues = {
    baseUrl: `http://localhost:${process.env['API_PORT'] ?? '3000'}`,
    token: await createTestToken({ userId: TEST_OWNER_ID, permissions: ['tasks:read', 'tasks:write'] }, tokenSettings),
    readerToken: await createTestToken({ userId: TEST_OWNER_ID, permissions: ['tasks:read'] }, tokenSettings),
    otherUserToken: await createTestToken({ userId: OTHER_OWNER_ID, permissions: ['tasks:read', 'tasks:write'] }, tokenSettings),
  };
  mkdirSync('.ligeirinho', { recursive: true });
  writeFileSync('.ligeirinho/seed.json', `${JSON.stringify(seedValues, null, 2)}\n`);
  console.log(`Seeded ${SAMPLE_TASKS.length} tasks. Tokens are in .ligeirinho/seed.json`);
}

void seed();
