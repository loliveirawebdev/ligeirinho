import { randomUUID } from 'node:crypto';
import type { TaskIdGenerator } from '@app/tasks-application';
import { toTaskId, type TaskId } from '@app/tasks-domain';

export class RandomTaskIdGenerator implements TaskIdGenerator {
  nextTaskId(): TaskId {
    return toTaskId(randomUUID());
  }
}
