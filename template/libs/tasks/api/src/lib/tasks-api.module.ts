import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import type { DomainErrorStatuses } from '@app/shared-http';
import {
  CLOCK,
  CompleteTask,
  CreateTask,
  GetTask,
  ListTasks,
  TASK_ID_GENERATOR,
  TASK_REPOSITORY,
  type Clock,
  type TaskIdGenerator,
  type TaskRepository,
} from '@app/tasks-application';
import { TaskController } from './task.controller';
import { TasksController } from './tasks.controller';

export const TASK_ERROR_STATUSES: DomainErrorStatuses = {
  'task-not-found': 404,
  'invalid-task-title': 422,
};

/**
 * The presentation layer never imports infrastructure: the app (composition root) passes the providers
 * that bind TASK_REPOSITORY, CLOCK and TASK_ID_GENERATOR to real adapters, and tests pass fakes.
 */
@Module({})
export class TasksApiModule {
  static withAdapters(adapterProviders: Provider[]): DynamicModule {
    return {
      module: TasksApiModule,
      controllers: [TasksController, TaskController],
      providers: [
        ...adapterProviders,
        {
          provide: CreateTask,
          useFactory: (repository: TaskRepository, clock: Clock, idGenerator: TaskIdGenerator) =>
            new CreateTask(repository, clock, idGenerator),
          inject: [TASK_REPOSITORY, CLOCK, TASK_ID_GENERATOR],
        },
        { provide: ListTasks, useFactory: (repository: TaskRepository) => new ListTasks(repository), inject: [TASK_REPOSITORY] },
        { provide: GetTask, useFactory: (repository: TaskRepository) => new GetTask(repository), inject: [TASK_REPOSITORY] },
        {
          provide: CompleteTask,
          useFactory: (repository: TaskRepository, clock: Clock) => new CompleteTask(repository, clock),
          inject: [TASK_REPOSITORY, CLOCK],
        },
      ],
    };
  }
}
