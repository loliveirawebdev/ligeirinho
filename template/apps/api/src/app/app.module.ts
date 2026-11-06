import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { createDatabaseClient, DATABASE_CLIENT, type DatabaseClient } from '@app/shared-database';
import { AccessModule } from '@app/shared-auth';
import { ProblemDetailsFilter } from '@app/shared-http';
import { CLOCK, TASK_ID_GENERATOR, TASK_REPOSITORY } from '@app/tasks-application';
import { TASK_ERROR_STATUSES, TasksApiModule } from '@app/tasks-api';
import { PrismaTaskRepository, RandomTaskIdGenerator, SystemClock } from '@app/tasks-infrastructure';
import type { Environment } from './environment';
import { HealthController } from './health.controller';

const REQUESTS_PER_MINUTE = 120;

export interface AppAdapters {
  readonly tasks: Provider[];
}

/** The composition root: the only place that knows which adapter backs each port. */
export function createProductionAdapters(environment: Environment): AppAdapters {
  const databaseClientProvider: Provider = {
    provide: DATABASE_CLIENT,
    useFactory: () => createDatabaseClient(environment.databaseUrl),
  };
  return {
    tasks: [
      databaseClientProvider,
      { provide: TASK_REPOSITORY, useFactory: (client: DatabaseClient) => new PrismaTaskRepository(client), inject: [DATABASE_CLIENT] },
      { provide: CLOCK, useClass: SystemClock },
      { provide: TASK_ID_GENERATOR, useClass: RandomTaskIdGenerator },
    ],
  };
}

@Module({})
export class AppModule {
  static create(environment: Environment, adapters: AppAdapters): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: REQUESTS_PER_MINUTE }]),
        AccessModule.forRoot({
          secret: environment.tokenSecret,
          issuer: environment.tokenIssuer,
          audience: environment.tokenAudience,
        }),
        TasksApiModule.withAdapters(adapters.tasks),
      ],
      controllers: [HealthController],
      providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_FILTER, useValue: new ProblemDetailsFilter({ ...TASK_ERROR_STATUSES }) },
      ],
    };
  }
}
