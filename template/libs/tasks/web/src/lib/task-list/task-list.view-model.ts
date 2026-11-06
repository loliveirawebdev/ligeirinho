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

const sameYearFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const otherYearFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

/** `now` is a parameter so scenarios and tests are deterministic; the page passes nothing. */
export function buildTaskListViewModel(state: TaskListState, now: Date = new Date()): TaskListViewModel {
  const openTaskCount = state.tasks.filter((task) => !task.completed).length;
  return {
    isLoading: state.status === 'loading',
    showEmptyState: state.status === 'ready' && state.tasks.length === 0,
    showError: state.status === 'failed',
    items: state.tasks.map((task) => toTaskListItem(task, now)),
    canLoadMore: state.status === 'ready' && state.hasMorePages,
    isCreatingTask: state.isCreatingTask,
    openTaskCountLabel: openTaskCountLabel(state.tasks.length, openTaskCount),
  };
}

// No count next to the empty state (it already says so), and zero in words.
function openTaskCountLabel(taskCount: number, openTaskCount: number): string {
  if (taskCount === 0) return '';
  if (openTaskCount === 0) return 'All done';
  return openTaskCount === 1 ? '1 open task' : `${openTaskCount} open tasks`;
}

function toTaskListItem(task: TaskSummary, now: Date): TaskListItem {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    createdAtLabel: `Added ${relativeDay(new Date(task.createdAt), now)}`,
    completeLabel: `Complete “${task.title}”`,
  };
}

function relativeDay(date: Date, now: Date): string {
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return date.getFullYear() === now.getFullYear() ? sameYearFormat.format(date) : otherYearFormat.format(date);
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
