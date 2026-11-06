import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import type { App } from 'supertest/types';
import { assert } from 'vitest';
import { TEST_TOKEN_SETTINGS } from '@app/shared-auth/testing';
import { CLOCK, TASK_ID_GENERATOR, TASK_REPOSITORY } from '@app/tasks-application';
import { FixedClock, InMemoryTaskRepository } from '@app/tasks-application/testing';
import { RandomTaskIdGenerator } from '@app/tasks-infrastructure';
import { AppModule } from '../app/app.module';
import { configureApp } from '../app/configure-app';
import type { Environment } from '../app/environment';

export const TEST_ENVIRONMENT: Environment = {
  port: 0,
  databaseUrl: 'postgresql://unused-in-http-tests',
  webOrigin: 'http://localhost:4200',
  tokenSecret: TEST_TOKEN_SETTINGS.secret,
  tokenIssuer: TEST_TOKEN_SETTINGS.issuer,
  tokenAudience: TEST_TOKEN_SETTINGS.audience,
};

export interface TestApp {
  readonly app: INestApplication;
  readonly taskRepository: InMemoryTaskRepository;
}

/** The real app wiring with in-memory fakes behind the ports: HTTP, guards and filters are all real. */
export async function createTestApp(): Promise<TestApp> {
  const taskRepository = new InMemoryTaskRepository();
  const testingModule = await Test.createTestingModule({
    imports: [
      AppModule.create(TEST_ENVIRONMENT, {
        tasks: [
          { provide: TASK_REPOSITORY, useValue: taskRepository },
          { provide: CLOCK, useValue: new FixedClock(new Date('2026-03-01T09:00:00Z')) },
          { provide: TASK_ID_GENERATOR, useClass: RandomTaskIdGenerator },
        ],
      }),
    ],
  }).compile();
  const app = testingModule.createNestApplication();
  configureApp(app, TEST_ENVIRONMENT);
  await app.init();
  return { app, taskRepository };
}

/** The HTTP server for supertest, typed (getHttpServer() returns any). */
export function httpServerOf(app: INestApplication): App {
  const server: unknown = app.getHttpServer();
  assert(server instanceof Server, 'the app has no HTTP server');
  return server;
}

interface TaskBody {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
}

interface ProblemBody {
  readonly type: string;
  readonly status: number;
}

function isTaskBody(value: unknown): value is TaskBody {
  return typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string';
}

function isProblemBody(value: unknown): value is ProblemBody {
  return typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string';
}

// supertest types the body as any; these read it as unknown and check its shape.
export function readTask(response: { readonly body: unknown }): TaskBody {
  assert(isTaskBody(response.body), 'the body is not a task');
  return response.body;
}

export function readTaskIds(response: { readonly body: unknown }): string[] {
  const { body } = response;
  assert(typeof body === 'object' && body !== null && 'items' in body && Array.isArray(body.items), 'the body is not a page');
  const items: unknown[] = body.items;
  return items.filter(isTaskBody).map((task) => task.id);
}

export function readProblem(response: { readonly body: unknown }): ProblemBody {
  assert(isProblemBody(response.body), 'the body is not problem details');
  return response.body;
}
