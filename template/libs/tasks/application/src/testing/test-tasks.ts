import { toUserId, type UserId } from '@app/shared-kernel';
import { createTask, createTaskTitle, toTaskId, type Task } from '@app/tasks-domain';

export const TEST_OWNER_ID: UserId = toUserId('00000000-0000-4000-8000-000000000001');
export const OTHER_OWNER_ID: UserId = toUserId('00000000-0000-4000-8000-000000000002');

interface TestTaskOverrides {
  readonly id?: string;
  readonly ownerId?: UserId;
  readonly title?: string;
  readonly createdAt?: Date;
  readonly completedAt?: Date;
}

/** The one place test tasks come from: unit tests, the seed and e2e all use it. */
export function createTestTask(overrides: TestTaskOverrides = {}): Task {
  const task = createTask({
    id: toTaskId(overrides.id ?? '10000000-0000-4000-8000-000000000001'),
    ownerId: overrides.ownerId ?? TEST_OWNER_ID,
    title: createTaskTitle(overrides.title ?? 'Write the plan'),
    now: overrides.createdAt ?? new Date('2026-01-10T10:00:00Z'),
  });
  return overrides.completedAt === undefined ? task : { ...task, completedAt: overrides.completedAt };
}
