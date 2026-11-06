import type { DatabaseClient, TaskRow } from '@app/shared-database';
import { toUserId, type Page, type PageRequest, type UserId } from '@app/shared-kernel';
import type { TaskRepository } from '@app/tasks-application';
import { createTaskTitle, toTaskId, type Task, type TaskId } from '@app/tasks-domain';

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async save(task: Task): Promise<void> {
    const row = toTaskRow(task);
    await this.databaseClient.task.upsert({ where: { id: row.id }, create: row, update: row });
  }

  async findOwnedTask(ownerId: UserId, taskId: TaskId): Promise<Task | undefined> {
    const row = await this.databaseClient.task.findFirst({ where: { id: taskId, ownerId } });
    return row === null ? undefined : toTask(row);
  }

  async listOwnedTasks(ownerId: UserId, pageRequest: PageRequest): Promise<Page<Task>> {
    // Fetching one extra row tells whether there is a next page without a COUNT query.
    const rows = await this.databaseClient.task.findMany({
      where: { ownerId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageRequest.limit + 1,
      ...(pageRequest.cursor === undefined ? {} : { cursor: { id: pageRequest.cursor }, skip: 1 }),
    });
    const pageRows = rows.slice(0, pageRequest.limit);
    const hasMore = rows.length > pageRequest.limit;
    return { items: pageRows.map(toTask), nextCursor: hasMore ? pageRows.at(-1)?.id : undefined };
  }
}

function toTaskRow(task: Task): TaskRow {
  return {
    id: task.id,
    ownerId: task.ownerId,
    title: task.title,
    completedAt: task.completedAt ?? null,
    createdAt: task.createdAt,
  };
}

function toTask(row: TaskRow): Task {
  return {
    id: toTaskId(row.id),
    ownerId: toUserId(row.ownerId),
    title: createTaskTitle(row.title),
    completedAt: row.completedAt ?? undefined,
    createdAt: row.createdAt,
  };
}
