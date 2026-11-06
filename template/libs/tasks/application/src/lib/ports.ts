import type { Page, PageRequest, UserId } from '@app/shared-kernel';
import type { Task, TaskId } from '@app/tasks-domain';

export interface TaskRepository {
  save(task: Task): Promise<void>;
  /** Looks up by owner too, so a task from another user is never returned (object-level authorization). */
  findOwnedTask(ownerId: UserId, taskId: TaskId): Promise<Task | undefined>;
  listOwnedTasks(ownerId: UserId, pageRequest: PageRequest): Promise<Page<Task>>;
}

export interface Clock {
  now(): Date;
}

export interface TaskIdGenerator {
  nextTaskId(): TaskId;
}

export const TASK_REPOSITORY = Symbol('TaskRepository');
export const CLOCK = Symbol('Clock');
export const TASK_ID_GENERATOR = Symbol('TaskIdGenerator');
