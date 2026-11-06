import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import type { TaskPage, TaskSummary } from '../task-summary';
import { TasksApiClient } from '../tasks-api.client';
import { SAMPLE_TASKS } from './task-list.sample-tasks';
import { TaskListPage } from './task-list.page';

class TasksApiUnavailable extends Error {
  override readonly name = 'TasksApiUnavailable';
}

class FakeTaskNotFound extends Error {
  override readonly name = 'FakeTaskNotFound';

  constructor(taskId: string) {
    super(`No task ${taskId}`);
  }
}

/** Fake with the same behavior as the API, kept in memory. */
class FakeTasksApiClient implements Pick<TasksApiClient, 'listTasks' | 'createTask' | 'completeTask'> {
  failNextList = false;
  private tasks: TaskSummary[] = [...SAMPLE_TASKS];

  listTasks(): Promise<TaskPage> {
    if (this.failNextList) {
      this.failNextList = false;
      return Promise.reject(new TasksApiUnavailable());
    }
    return Promise.resolve({ items: this.tasks });
  }

  createTask(title: string): Promise<TaskSummary> {
    const createdTask = { id: `new-${this.tasks.length}`, title, completed: false, createdAt: '2026-03-04T09:00:00Z' };
    this.tasks = [createdTask, ...this.tasks];
    return Promise.resolve(createdTask);
  }

  completeTask(taskId: string): Promise<TaskSummary> {
    const completedTask = { ...this.findTask(taskId), completed: true };
    this.tasks = this.tasks.map((task) => (task.id === taskId ? completedTask : task));
    return Promise.resolve(completedTask);
  }

  private findTask(taskId: string): TaskSummary {
    const task = this.tasks.find((candidate) => candidate.id === taskId);
    if (task === undefined) {
      throw new FakeTaskNotFound(taskId);
    }
    return task;
  }
}

async function renderPage(fakeClient = new FakeTasksApiClient()) {
  await render(TaskListPage, { providers: [{ provide: TasksApiClient, useValue: fakeClient }] });
  return fakeClient;
}

describe('task list page', () => {
  it('loads and shows the tasks', async () => {
    await renderPage();
    expect(await screen.findByText('Review the plan with the team')).toBeTruthy();
  });

  it('adds a created task at the top', async () => {
    await renderPage();
    await userEvent.type(await screen.findByLabelText('New task'), 'Write the e2e');
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }));
    const items = await screen.findAllByRole('listitem');
    expect(items[0]?.textContent).toContain('Write the e2e');
  });

  it('marks a task as done', async () => {
    await renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Complete "Review the plan with the team"' }));
    expect(screen.queryByRole('button', { name: 'Complete "Review the plan with the team"' })).toBeNull();
  });

  it('recovers after a failed load', async () => {
    const fakeClient = new FakeTasksApiClient();
    fakeClient.failNextList = true;
    await renderPage(fakeClient);
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Review the plan with the team')).toBeTruthy();
  });
});
