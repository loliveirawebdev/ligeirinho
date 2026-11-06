import { Body, Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type AuthenticatedUser } from '@app/shared-auth';
import { ApiProblemResponses } from '@app/shared-http';
import { CreateTask, ListTasks } from '@app/tasks-application';
import type { Response } from 'express';
import { CreateTaskRequest, ListTasksRequest } from './task-requests';
import { TaskPageResponse, TaskResponse, toTaskPageResponse, toTaskResponse } from './task-responses';

export const TASKS_READ = 'tasks:read';
export const TASKS_WRITE = 'tasks:write';

/** The collection: `/tasks`. */
@ApiTags('tasks')
@ApiBearerAuth()
@ApiProblemResponses(401, 403, 429)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly createTaskUseCase: CreateTask,
    private readonly listTasksUseCase: ListTasks,
  ) {}

  @Get()
  @RequirePermission(TASKS_READ)
  @ApiOkResponse({ type: TaskPageResponse })
  @ApiProblemResponses(400)
  async listTasks(@CurrentUser() user: AuthenticatedUser, @Query() query: ListTasksRequest): Promise<TaskPageResponse> {
    const page = await this.listTasksUseCase.execute({ ownerId: user.id, cursor: query.cursor, limit: query.limit });
    return toTaskPageResponse(page);
  }

  @Post()
  @HttpCode(201)
  @RequirePermission(TASKS_WRITE)
  @ApiCreatedResponse({
    type: TaskResponse,
    headers: { Location: { description: 'URL of the created task', schema: { type: 'string' } } },
  })
  @ApiProblemResponses(400, 422)
  async createTask(
    @CurrentUser() user: AuthenticatedUser,
    @Body() request: CreateTaskRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TaskResponse> {
    const task = await this.createTaskUseCase.execute({ ownerId: user.id, title: request.title });
    response.location(`/tasks/${task.id}`);
    return toTaskResponse(task);
  }
}
