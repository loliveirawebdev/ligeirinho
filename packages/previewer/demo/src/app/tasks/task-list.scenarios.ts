import { defineScenarios } from '@ligeirinho/previewer';
import { TaskListView } from './task-list.view';
import type { TaskListViewModel } from './task-list.view-model';

export const taskListScenarios = defineScenarios<TaskListViewModel>({
  flow: 'Tasks',
  title: 'Task list',
  component: TaskListView,
  scenarios: {
    empty: { heading: 'Tasks', tasks: [], emptyMessage: 'No tasks yet. Add your first one.', errorMessage: null },
    full: {
      heading: 'Tasks',
      tasks: [
        { id: 'task-1', title: 'Write the view-model first', done: true },
        { id: 'task-2', title: 'Write the scenarios next to the view', done: false },
        { id: 'task-3', title: 'Check every scenario at 390, 768 and 1280 px', done: false },
      ],
      emptyMessage: null,
      errorMessage: null,
    },
    error: { heading: 'Tasks', tasks: [], emptyMessage: null, errorMessage: 'The tasks could not be loaded.' },
  },
});
