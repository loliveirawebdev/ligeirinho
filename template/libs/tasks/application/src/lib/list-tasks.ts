import { DEFAULT_PAGE_LIMIT, MAXIMUM_PAGE_LIMIT, type Page, type UserId } from '@app/shared-kernel';
import type { Task } from '@app/tasks-domain';
import type { TaskRepository } from './ports';

export interface ListTasksQuery {
  readonly ownerId: UserId;
  readonly cursor: string | undefined;
  readonly limit: number | undefined;
}

export class ListTasks {
  constructor(private readonly taskRepository: TaskRepository) {}

  execute(query: ListTasksQuery): Promise<Page<Task>> {
    const limit = Math.min(query.limit ?? DEFAULT_PAGE_LIMIT, MAXIMUM_PAGE_LIMIT);
    return this.taskRepository.listOwnedTasks(query.ownerId, { cursor: query.cursor, limit });
  }
}
