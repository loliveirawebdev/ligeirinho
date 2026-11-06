import { DomainError } from '@app/shared-kernel';

export class InvalidTaskTitle extends DomainError {
  readonly type = 'invalid-task-title';

  constructor(reason: string) {
    super(`Invalid task title: ${reason}`);
  }
}

export class TaskNotFound extends DomainError {
  readonly type = 'task-not-found';

  constructor(taskId: string) {
    super(`Task ${taskId} was not found`);
  }
}
