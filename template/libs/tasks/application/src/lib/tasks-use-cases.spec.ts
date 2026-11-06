import { TaskNotFound, InvalidTaskTitle, toTaskId } from '@app/tasks-domain';
import {
  createTestTask,
  FixedClock,
  InMemoryTaskRepository,
  OTHER_OWNER_ID,
  SequentialTaskIdGenerator,
  TEST_OWNER_ID,
} from '../testing';
import { CompleteTask } from './complete-task';
import { CreateTask } from './create-task';
import { GetTask } from './get-task';
import { ListTasks } from './list-tasks';

const startTime = new Date('2026-03-01T09:00:00Z');

function buildUseCases() {
  const taskRepository = new InMemoryTaskRepository();
  const clock = new FixedClock(startTime);
  return {
    taskRepository,
    clock,
    createTaskUseCase: new CreateTask(taskRepository, clock, new SequentialTaskIdGenerator()),
    completeTaskUseCase: new CompleteTask(taskRepository, clock),
    getTaskUseCase: new GetTask(taskRepository),
    listTasksUseCase: new ListTasks(taskRepository),
  };
}

describe('create task', () => {
  it('saves an open task owned by the caller', async () => {
    const { createTaskUseCase, getTaskUseCase } = buildUseCases();
    const createdTask = await createTaskUseCase.execute({ ownerId: TEST_OWNER_ID, title: ' Ship it ' });
    const storedTask = await getTaskUseCase.execute(TEST_OWNER_ID, createdTask.id);
    expect(storedTask).toMatchObject({ title: 'Ship it', completedAt: undefined, createdAt: startTime });
  });

  it('refuses an empty title', async () => {
    const { createTaskUseCase } = buildUseCases();
    await expect(createTaskUseCase.execute({ ownerId: TEST_OWNER_ID, title: '' })).rejects.toThrow(InvalidTaskTitle);
  });
});

describe('complete task', () => {
  it('marks the task as completed now', async () => {
    const { taskRepository, completeTaskUseCase } = buildUseCases();
    const openTask = createTestTask();
    await taskRepository.save(openTask);
    const completedTask = await completeTaskUseCase.execute({ ownerId: TEST_OWNER_ID, taskId: openTask.id });
    expect(completedTask.completedAt).toEqual(startTime);
  });

  it('does not reveal tasks owned by someone else', async () => {
    const { taskRepository, completeTaskUseCase } = buildUseCases();
    const otherOwnersTask = createTestTask({ ownerId: OTHER_OWNER_ID });
    await taskRepository.save(otherOwnersTask);
    await expect(
      completeTaskUseCase.execute({ ownerId: TEST_OWNER_ID, taskId: otherOwnersTask.id }),
    ).rejects.toThrow(TaskNotFound);
  });
});

describe('get task', () => {
  it('fails for an unknown task', async () => {
    const { getTaskUseCase } = buildUseCases();
    await expect(getTaskUseCase.execute(TEST_OWNER_ID, toTaskId('missing'))).rejects.toThrow(TaskNotFound);
  });
});

describe('list tasks', () => {
  it('pages through the caller tasks, newest first', async () => {
    const { createTaskUseCase, listTasksUseCase, clock } = buildUseCases();
    for (const title of ['First', 'Second', 'Third']) {
      await createTaskUseCase.execute({ ownerId: TEST_OWNER_ID, title });
      clock.advanceBy(1000);
    }
    const firstPage = await listTasksUseCase.execute({ ownerId: TEST_OWNER_ID, cursor: undefined, limit: 2 });
    const secondPage = await listTasksUseCase.execute({ ownerId: TEST_OWNER_ID, cursor: firstPage.nextCursor, limit: 2 });
    expect(firstPage.items.map((task) => task.title)).toEqual(['Third', 'Second']);
    expect(secondPage.items.map((task) => task.title)).toEqual(['First']);
    expect(secondPage.nextCursor).toBeUndefined();
  });

  it('never lists tasks owned by someone else', async () => {
    const { taskRepository, listTasksUseCase } = buildUseCases();
    await taskRepository.save(createTestTask({ ownerId: OTHER_OWNER_ID }));
    const page = await listTasksUseCase.execute({ ownerId: TEST_OWNER_ID, cursor: undefined, limit: undefined });
    expect(page.items).toEqual([]);
  });

  it('caps the page size at the maximum limit', async () => {
    const { taskRepository, listTasksUseCase } = buildUseCases();
    for (let index = 0; index < 120; index += 1) {
      await taskRepository.save(createTestTask({ id: `task-${index}`, createdAt: new Date(startTime.getTime() + index) }));
    }
    const page = await listTasksUseCase.execute({ ownerId: TEST_OWNER_ID, cursor: undefined, limit: 500 });
    expect(page.items).toHaveLength(100);
  });
});
