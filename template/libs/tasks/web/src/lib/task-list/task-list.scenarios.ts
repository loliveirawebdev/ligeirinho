import { defineScenarios } from '@ligeirinho/previewer';
import { TaskListView } from './task-list.view';
import { SAMPLE_TASKS } from './task-list.sample-tasks';
import { buildTaskListViewModel, type TaskListState } from './task-list.view-model';

const readyState: TaskListState = { status: 'ready', tasks: SAMPLE_TASKS, hasMorePages: true, isCreatingTask: false };

export const taskListScenarios = defineScenarios({
  flow: 'Tasks',
  title: 'Task list',
  component: TaskListView,
  scenarios: {
    full: buildTaskListViewModel(readyState),
    empty: buildTaskListViewModel({ ...readyState, tasks: [], hasMorePages: false }),
    loading: buildTaskListViewModel({ ...readyState, status: 'loading', tasks: [] }),
    failed: buildTaskListViewModel({ ...readyState, status: 'failed', tasks: [] }),
    creating: buildTaskListViewModel({ ...readyState, isCreatingTask: true }),
  },
});
