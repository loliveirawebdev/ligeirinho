import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type AuthenticatedUser } from '@app/shared-auth';
import { ApiProblemResponses } from '@app/shared-http';
import { CompleteTask, GetTask } from '@app/tasks-application';
import { toTaskId } from '@app/tasks-domain';
import { UpdateTaskRequest } from './task-requests';
import { TaskResponse, toTaskResponse } from './task-responses';
import { TASKS_READ, TASKS_WRITE } from './tasks.controller';

/** One task: `/tasks/{taskId}`. */
@ApiTags('tasks')
@ApiBearerAuth()
@ApiProblemResponses(401, 403, 429)
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly getTaskUseCase: GetTask,
    private readonly completeTaskUseCase: CompleteTask,
  ) {}

  @Get(':taskId')
  @RequirePermission(TASKS_READ)
  @ApiOkResponse({ type: TaskResponse })
  @ApiProblemResponses(400, 404)
  async getTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<TaskResponse> {
    return toTaskResponse(await this.getTaskUseCase.execute(user.id, toTaskId(taskId)));
  }

  @Patch(':taskId')
  @RequirePermission(TASKS_WRITE)
  @ApiOkResponse({ type: TaskResponse })
  @ApiProblemResponses(400, 404)
  async updateTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() _request: UpdateTaskRequest,
  ): Promise<TaskResponse> {
    return toTaskResponse(await this.completeTaskUseCase.execute({ ownerId: user.id, taskId: toTaskId(taskId) }));
  }
}
