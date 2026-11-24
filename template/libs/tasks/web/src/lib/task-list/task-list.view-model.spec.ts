import { selectCopy } from '@app/ui';
import { taskListCopy } from './task-list.copy';
import { SAMPLE_TASKS } from './task-list.sample-tasks';
import { buildTaskListViewModel, type TaskListState } from './task-list.view-model';

const now = new Date('2026-03-03T15:00:00Z');
const copy = selectCopy(taskListCopy, 'en');
const readyState: TaskListState = { status: 'ready', tasks: SAMPLE_TASKS, hasMorePages: false, isCreatingTask: false };

describe('task list view-model', () => {
  it('counts only open tasks', () => {
    expect(buildTaskListViewModel(readyState, copy).openTaskCountLabel).toBe('2 open tasks');
  });

  it('uses the singular for one open task', () => {
    const oneOpenTask = SAMPLE_TASKS.slice(0, 1);
    expect(buildTaskListViewModel({ ...readyState, tasks: oneOpenTask }, copy).openTaskCountLabel).toBe('1 open task');
  });

  it('says "All done" instead of zero, and nothing next to the empty state', () => {
    const allDone = SAMPLE_TASKS.map((task) => ({ ...task, completed: true }));
    expect(buildTaskListViewModel({ ...readyState, tasks: allDone }, copy).openTaskCountLabel).toBe('All done');
    expect(buildTaskListViewModel({ ...readyState, tasks: [] }, copy).openTaskCountLabel).toBe('');
  });

  it('shows the empty state only once loaded with no tasks', () => {
    expect(buildTaskListViewModel({ ...readyState, tasks: [] }, copy).showEmptyState).toBe(true);
    expect(buildTaskListViewModel({ ...readyState, status: 'loading', tasks: [] }, copy).showEmptyState).toBe(false);
  });

  it('offers more pages only when ready', () => {
    expect(buildTaskListViewModel({ ...readyState, hasMorePages: true }, copy).canLoadMore).toBe(true);
    expect(buildTaskListViewModel({ ...readyState, status: 'failed', hasMorePages: true }, copy).canLoadMore).toBe(false);
  });

  it('dates tasks relative to today, with the year only when it differs', () => {
    expect(buildTaskListViewModel(readyState, copy, now).items.map((item) => item.createdAtLabel)).toEqual([
      'Today',
      'Yesterday',
      'Mar 1',
    ]);
    expect(buildTaskListViewModel(readyState, copy, new Date('2027-01-10T12:00:00Z')).items[0]?.createdAtLabel).toBe(
      'Mar 3, 2026',
    );
  });
});
