import { SAMPLE_TASKS } from './task-list.sample-tasks';
import { buildTaskListViewModel, type TaskListState } from './task-list.view-model';

const readyState: TaskListState = { status: 'ready', tasks: SAMPLE_TASKS, hasMorePages: false, isCreatingTask: false };

describe('task list view-model', () => {
  it('counts only open tasks', () => {
    expect(buildTaskListViewModel(readyState).openTaskCountLabel).toBe('2 open tasks');
  });

  it('uses the singular for one open task', () => {
    const oneOpenTask = SAMPLE_TASKS.slice(0, 1);
    expect(buildTaskListViewModel({ ...readyState, tasks: oneOpenTask }).openTaskCountLabel).toBe('1 open task');
  });

  it('shows the empty state only once loaded with no tasks', () => {
    expect(buildTaskListViewModel({ ...readyState, tasks: [] }).showEmptyState).toBe(true);
    expect(buildTaskListViewModel({ ...readyState, status: 'loading', tasks: [] }).showEmptyState).toBe(false);
  });

  it('offers more pages only when ready', () => {
    expect(buildTaskListViewModel({ ...readyState, hasMorePages: true }).canLoadMore).toBe(true);
    expect(buildTaskListViewModel({ ...readyState, status: 'failed', hasMorePages: true }).canLoadMore).toBe(false);
  });

  it('formats the creation date', () => {
    expect(buildTaskListViewModel(readyState).items[0]?.createdAtLabel).toBe('Created Mar 3, 2026');
  });
});
