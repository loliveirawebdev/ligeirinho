import { defineScenarios } from '@ligeirinho/previewer';
import { TaskListView } from './task-list.view';
import type { TaskListViewModel } from './task-list.view-model';

const fullTasks: TaskListViewModel = {
  heading: 'Tasks',
  tasks: [
    { id: 'task-1', title: 'Write the view-model first', done: true },
    { id: 'task-2', title: 'Write the scenarios next to the view', done: false },
    { id: 'task-3', title: 'Check every scenario at 390, 768 and 1280 px', done: false },
  ],
  emptyMessage: null,
  errorMessage: null,
};

export const taskListScenarios = defineScenarios<TaskListViewModel>({
  flow: 'Tasks',
  title: 'Task list',
  component: TaskListView,
  scenarios: {
    empty: { heading: 'Tasks', tasks: [], emptyMessage: 'No tasks yet. Add your first one.', errorMessage: null },
    full: fullTasks,
    error: { heading: 'Tasks', tasks: [], emptyMessage: null, errorMessage: 'The tasks could not be loaded.' },
    confirmDelete: fullTasks,
  },
  // The confirmation is local view state: no view-model shows it, so a play step opens it.
  play: {
    confirmDelete: async ({ canvas, step }) => {
      await step('Click “Delete…” on the second task', () => {
        const deleteButton = canvas.querySelector<HTMLButtonElement>(
          '[aria-label="Delete: Write the scenarios next to the view…"]',
        );
        if (deleteButton === null) {
          throw new Error('no “Delete…” button for the second task');
        }
        deleteButton.click();
      });
    },
  },
});
