import { defineCopy } from '@app/ui';

/**
 * Every text of the task list, by locale (rules/copy.md). Keys name the meaning; a key ending in `Action` is a
 * button. Add a locale by copying the source block and translating it with the glossary (docs/glossary.md).
 */
export const taskListCopy = defineCopy({
  en: {
    title: 'Tasks',
    openTaskCount: { one: '{count} open task', other: '{count} open tasks' },
    allDone: 'All done',
    newTaskLabel: 'New task',
    newTaskPlaceholder: 'What needs doing?',
    addTaskAction: 'Add task',
    addingTask: 'Adding…',
    loading: 'Loading tasks…',
    loadFailedTitle: 'The tasks could not be loaded',
    loadFailedMessage: 'Check the connection and try again.',
    retryAction: 'Try again',
    emptyTitle: 'No tasks yet',
    emptyMessage: 'Tasks you add appear here.',
    listLabel: 'Tasks',
    completeTask: 'Complete “{title}”',
    completed: 'Completed',
    showMoreAction: 'Show more',
    today: 'Today',
    yesterday: 'Yesterday',
  },
});

export type TaskListText = (typeof taskListCopy)['en'];
