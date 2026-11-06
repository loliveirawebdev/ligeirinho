import { toBranded, type Brand, type UserId } from '@app/shared-kernel';
import { InvalidTaskTitle } from './task-errors';

export type TaskId = Brand<string, 'TaskId'>;
export type TaskTitle = Brand<string, 'TaskTitle'>;

export const MAXIMUM_TASK_TITLE_LENGTH = 200;

export interface Task {
  readonly id: TaskId;
  readonly ownerId: UserId;
  readonly title: TaskTitle;
  readonly completedAt: Date | undefined;
  readonly createdAt: Date;
}

export interface NewTask {
  readonly id: TaskId;
  readonly ownerId: UserId;
  readonly title: TaskTitle;
  readonly now: Date;
}

export function toTaskId(rawTaskId: string): TaskId {
  return toBranded<TaskId>(rawTaskId);
}

export function createTaskTitle(rawTitle: string): TaskTitle {
  const trimmedTitle = rawTitle.trim();
  if (trimmedTitle.length === 0) {
    throw new InvalidTaskTitle('it is empty');
  }
  if (trimmedTitle.length > MAXIMUM_TASK_TITLE_LENGTH) {
    throw new InvalidTaskTitle(`it is longer than ${MAXIMUM_TASK_TITLE_LENGTH} characters`);
  }
  return toBranded<TaskTitle>(trimmedTitle);
}

export function createTask(newTask: NewTask): Task {
  return {
    id: newTask.id,
    ownerId: newTask.ownerId,
    title: newTask.title,
    completedAt: undefined,
    createdAt: newTask.now,
  };
}

/** Completing twice keeps the first completion date, so retried requests are harmless. */
export function completeTask(task: Task, now: Date): Task {
  if (task.completedAt !== undefined) {
    return task;
  }
  return { ...task, completedAt: now };
}

export function isTaskCompleted(task: Task): boolean {
  return task.completedAt !== undefined;
}
