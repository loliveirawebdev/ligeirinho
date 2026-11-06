import { defineScenarios } from '@ligeirinho/previewer';
import { TaskListView } from './task-list.view';
import { SAMPLE_TASKS } from './task-list.sample-tasks';
import { buildTaskListViewModel, type TaskListState } from './task-list.view-model';

// A fixed day, so the dates read 'today', 'yesterday' and 'Mar 1' in every preview.
const now = new Date('2026-03-03T15:00:00Z');
const readyState: TaskListState = { status: 'ready', tasks: SAMPLE_TASKS, hasMorePages: true, isCreatingTask: false };

export const taskListScenarios = defineScenarios({
  flow: 'Tasks',
  title: 'Task list',
  component: TaskListView,
  scenarios: {
    full: buildTaskListViewModel(readyState, now),
    empty: buildTaskListViewModel({ ...readyState, tasks: [], hasMorePages: false }, now),
    loading: buildTaskListViewModel({ ...readyState, status: 'loading', tasks: [] }, now),
    failed: buildTaskListViewModel({ ...readyState, status: 'failed', tasks: [] }, now),
    allDone: buildTaskListViewModel(
      { ...readyState, tasks: SAMPLE_TASKS.map((task) => ({ ...task, completed: true })), hasMorePages: false },
      now,
    ),
    creating: buildTaskListViewModel({ ...readyState, isCreatingTask: true }, now),
  },
});
