import type { TaskSummary } from '../task-summary';

export type TaskListStatus = 'loading' | 'ready' | 'failed';

/** What the page knows. */
export interface TaskListState {
  readonly status: TaskListStatus;
  readonly tasks: readonly TaskSummary[];
  readonly hasMorePages: boolean;
  readonly isCreatingTask: boolean;
}

export interface TaskListItem {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
  readonly createdAtLabel: string;
  readonly completeLabel: string;
}

/** What the view shows: every presentation decision is already made here. */
export interface TaskListViewModel {
  readonly isLoading: boolean;
  readonly showEmptyState: boolean;
  readonly showError: boolean;
  readonly items: readonly TaskListItem[];
  readonly canLoadMore: boolean;
  readonly isCreatingTask: boolean;
  readonly openTaskCountLabel: string;
}

const createdAtFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });

export function buildTaskListViewModel(state: TaskListState): TaskListViewModel {
  const openTaskCount = state.tasks.filter((task) => !task.completed).length;
  return {
    isLoading: state.status === 'loading',
    showEmptyState: state.status === 'ready' && state.tasks.length === 0,
    showError: state.status === 'failed',
    items: state.tasks.map(toTaskListItem),
    canLoadMore: state.status === 'ready' && state.hasMorePages,
    isCreatingTask: state.isCreatingTask,
    openTaskCountLabel: openTaskCount === 1 ? '1 open task' : `${openTaskCount} open tasks`,
  };
}

function toTaskListItem(task: TaskSummary): TaskListItem {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    createdAtLabel: `Created ${createdAtFormat.format(new Date(task.createdAt))}`,
    completeLabel: `Complete "${task.title}"`,
  };
}
