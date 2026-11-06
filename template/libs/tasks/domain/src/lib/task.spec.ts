import { toUserId } from '@app/shared-kernel';
import {
  completeTask,
  createTask,
  createTaskTitle,
  isTaskCompleted,
  MAXIMUM_TASK_TITLE_LENGTH,
  toTaskId,
} from './task';
import { InvalidTaskTitle } from './task-errors';

const creationDate = new Date('2026-01-10T10:00:00Z');
const completionDate = new Date('2026-01-11T10:00:00Z');

function buildOpenTask() {
  return createTask({
    id: toTaskId('task-1'),
    ownerId: toUserId('user-1'),
    title: createTaskTitle('Write the plan'),
    now: creationDate,
  });
}

describe('task title', () => {
  it('trims surrounding spaces', () => {
    expect(createTaskTitle('  Write the plan  ')).toBe('Write the plan');
  });

  it('rejects an empty title', () => {
    expect(() => createTaskTitle('   ')).toThrow(InvalidTaskTitle);
  });

  it('rejects a title above the maximum length', () => {
    expect(() => createTaskTitle('a'.repeat(MAXIMUM_TASK_TITLE_LENGTH + 1))).toThrow(InvalidTaskTitle);
  });
});

describe('task', () => {
  it('starts open', () => {
    expect(isTaskCompleted(buildOpenTask())).toBe(false);
  });

  it('records when it was completed', () => {
    expect(completeTask(buildOpenTask(), completionDate).completedAt).toEqual(completionDate);
  });

  it('keeps the first completion date when completed again', () => {
    const completedTask = completeTask(buildOpenTask(), completionDate);
    expect(completeTask(completedTask, new Date('2026-02-01T00:00:00Z')).completedAt).toEqual(completionDate);
  });
});
