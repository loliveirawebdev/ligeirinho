import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { taskListScenarios } from './task-list.scenarios';
import { TaskListView } from './task-list.view';

describe('task list view', () => {
  it('lists the tasks of the full scenario', async () => {
    await render(TaskListView, { inputs: { model: taskListScenarios.scenarios.full } });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('2 open tasks')).toBeTruthy();
  });

  it('shows the empty state', async () => {
    await render(TaskListView, { inputs: { model: taskListScenarios.scenarios.empty } });
    expect(screen.getByText(/No tasks yet/)).toBeTruthy();
  });

  it('offers a retry when loading failed', async () => {
    const retrySpy = { calls: 0 };
    await render(TaskListView, {
      inputs: { model: taskListScenarios.scenarios.failed },
      on: { retry: () => (retrySpy.calls += 1) },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retrySpy.calls).toBe(1);
  });

  it('emits the trimmed title of a new task', async () => {
    const createdTitles: string[] = [];
    await render(TaskListView, {
      inputs: { model: taskListScenarios.scenarios.empty },
      on: { createTask: (title: string) => createdTitles.push(title) },
    });
    await userEvent.type(screen.getByLabelText('New task'), '  Ship it  ');
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }));
    expect(createdTitles).toEqual(['Ship it']);
  });

  it('emits which task to complete', async () => {
    const completedTaskIds: string[] = [];
    await render(TaskListView, {
      inputs: { model: taskListScenarios.scenarios.full },
      on: { completeTask: (taskId: string) => completedTaskIds.push(taskId) },
    });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Complete “Review the plan with the team”' }));
    expect(completedTaskIds).toEqual(['10000000-0000-4000-8000-000000000003']);
  });

  it('disables adding while a task is being created', async () => {
    await render(TaskListView, { inputs: { model: taskListScenarios.scenarios.creating } });
    expect(screen.getByRole('button', { name: 'Adding…' }).hasAttribute('disabled')).toBe(true);
  });
});
