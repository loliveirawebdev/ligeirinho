import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Page } from '@app/shared-kernel';
import { isTaskCompleted, type Task } from '@app/tasks-domain';

export class TaskResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  completed!: boolean;

  @ApiPropertyOptional({ format: 'date-time' })
  completedAt?: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class TaskPageResponse {
  @ApiProperty({ type: [TaskResponse] })
  items!: TaskResponse[];

  @ApiPropertyOptional({ description: 'Pass as cursor to get the next page; absent on the last page' })
  nextCursor?: string;
}

export function toTaskResponse(task: Task): TaskResponse {
  return {
    id: task.id,
    title: task.title,
    completed: isTaskCompleted(task),
    ...(task.completedAt === undefined ? {} : { completedAt: task.completedAt.toISOString() }),
    createdAt: task.createdAt.toISOString(),
  };
}

export function toTaskPageResponse(page: Page<Task>): TaskPageResponse {
  return {
    items: page.items.map(toTaskResponse),
    ...(page.nextCursor === undefined ? {} : { nextCursor: page.nextCursor }),
  };
}
