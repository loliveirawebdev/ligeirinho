import type { UserId } from '@app/shared-kernel';
import { createTask, createTaskTitle, type Task } from '@app/tasks-domain';
import type { Clock, TaskIdGenerator, TaskRepository } from './ports';

export interface CreateTaskCommand {
  readonly ownerId: UserId;
  readonly title: string;
}

export class CreateTask {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly clock: Clock,
    private readonly taskIdGenerator: TaskIdGenerator,
  ) {}

  async execute(command: CreateTaskCommand): Promise<Task> {
    const task = createTask({
      id: this.taskIdGenerator.nextTaskId(),
      ownerId: command.ownerId,
      title: createTaskTitle(command.title),
      now: this.clock.now(),
    });
    await this.taskRepository.save(task);
    return task;
  }
}
