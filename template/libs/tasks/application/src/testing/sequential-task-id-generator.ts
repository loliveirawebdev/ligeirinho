import { toTaskId, type TaskId } from '@app/tasks-domain';
import type { TaskIdGenerator } from '../lib/ports';

export class SequentialTaskIdGenerator implements TaskIdGenerator {
  private generatedCount = 0;

  nextTaskId(): TaskId {
    this.generatedCount += 1;
    return toTaskId(`task-${String(this.generatedCount).padStart(4, '0')}`);
  }
}
