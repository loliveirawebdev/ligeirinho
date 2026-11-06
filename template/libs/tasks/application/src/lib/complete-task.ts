import type { UserId } from '@app/shared-kernel';
import { completeTask, TaskNotFound, type Task, type TaskId } from '@app/tasks-domain';
import type { Clock, TaskRepository } from './ports';

export interface CompleteTaskCommand {
  readonly ownerId: UserId;
  readonly taskId: TaskId;
}

export class CompleteTask {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly clock: Clock,
  ) {}

  async execute(command: CompleteTaskCommand): Promise<Task> {
    const task = await this.taskRepository.findOwnedTask(command.ownerId, command.taskId);
    if (task === undefined) {
      throw new TaskNotFound(command.taskId);
    }
    const completedTask = completeTask(task, this.clock.now());
    await this.taskRepository.save(completedTask);
    return completedTask;
  }
}
