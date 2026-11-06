import type { UserId } from '@app/shared-kernel';
import { TaskNotFound, type Task, type TaskId } from '@app/tasks-domain';
import type { TaskRepository } from './ports';

export class GetTask {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(ownerId: UserId, taskId: TaskId): Promise<Task> {
    const task = await this.taskRepository.findOwnedTask(ownerId, taskId);
    if (task === undefined) {
      throw new TaskNotFound(taskId);
    }
    return task;
  }
}
