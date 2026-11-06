import type { Page, PageRequest, UserId } from '@app/shared-kernel';
import type { Task, TaskId } from '@app/tasks-domain';
import type { TaskRepository } from '../lib/ports';

/** Behaves like the Prisma repository: newest first, cursor = id of the last item of the previous page. */
export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasksById = new Map<TaskId, Task>();

  save(task: Task): Promise<void> {
    this.tasksById.set(task.id, task);
    return Promise.resolve();
  }

  findOwnedTask(ownerId: UserId, taskId: TaskId): Promise<Task | undefined> {
    const task = this.tasksById.get(taskId);
    return Promise.resolve(task?.ownerId === ownerId ? task : undefined);
  }

  listOwnedTasks(ownerId: UserId, pageRequest: PageRequest): Promise<Page<Task>> {
    const ownedTasks = [...this.tasksById.values()]
      .filter((task) => task.ownerId === ownerId)
      .sort(compareNewestFirst);
    const startIndex = pageRequest.cursor === undefined
      ? 0
      : ownedTasks.findIndex((task) => task.id === pageRequest.cursor) + 1;
    const pageItems = ownedTasks.slice(startIndex, startIndex + pageRequest.limit);
    const hasMore = startIndex + pageRequest.limit < ownedTasks.length;
    return Promise.resolve({ items: pageItems, nextCursor: hasMore ? pageItems.at(-1)?.id : undefined });
  }
}

function compareNewestFirst(firstTask: Task, secondTask: Task): number {
  const byCreation = secondTask.createdAt.getTime() - firstTask.createdAt.getTime();
  return byCreation === 0 ? secondTask.id.localeCompare(firstTask.id) : byCreation;
}
