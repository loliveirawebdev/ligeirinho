import { formatText, pluralText, type LocalizedCopy } from '@app/ui';
import type { TaskSummary } from '../task-summary';
import type { TaskListText } from './task-list.copy';

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

/** What the view shows: every presentation decision, and every text, is already made here. */
export interface TaskListViewModel {
  readonly text: TaskListText;
  readonly isLoading: boolean;
  readonly showEmptyState: boolean;
  readonly showError: boolean;
  readonly items: readonly TaskListItem[];
  readonly canLoadMore: boolean;
  readonly isCreatingTask: boolean;
  readonly openTaskCountLabel: string;
}

/** `now` is a parameter so scenarios and tests are deterministic; the page passes nothing. */
export function buildTaskListViewModel(
  state: TaskListState,
  copy: LocalizedCopy<TaskListText>,
  now: Date = new Date(),
): TaskListViewModel {
  const openTaskCount = state.tasks.filter((task) => !task.completed).length;
  return {
    text: copy.text,
    isLoading: state.status === 'loading',
    showEmptyState: state.status === 'ready' && state.tasks.length === 0,
    showError: state.status === 'failed',
    items: state.tasks.map((task) => toTaskListItem(task, copy, now)),
    canLoadMore: state.status === 'ready' && state.hasMorePages,
    isCreatingTask: state.isCreatingTask,
    openTaskCountLabel: openTaskCountLabel(state.tasks.length, openTaskCount, copy),
  };
}

// No count next to the empty state (it already says so), and zero in words.
function openTaskCountLabel(taskCount: number, openTaskCount: number, copy: LocalizedCopy<TaskListText>): string {
  if (taskCount === 0) return '';
  if (openTaskCount === 0) return copy.text.allDone;
  return pluralText(copy.text.openTaskCount, openTaskCount, copy.locale);
}

function toTaskListItem(task: TaskSummary, copy: LocalizedCopy<TaskListText>, now: Date): TaskListItem {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    createdAtLabel: relativeDay(new Date(task.createdAt), now, copy),
    completeLabel: formatText(copy.text.completeTask, { title: task.title }),
  };
}

function relativeDay(date: Date, now: Date, copy: LocalizedCopy<TaskListText>): string {
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days === 0) return copy.text.today;
  if (days === 1) return copy.text.yesterday;
  const sameYear = date.getFullYear() === now.getFullYear();
  const format = sameYear ? { month: 'short', day: 'numeric' } as const : { dateStyle: 'medium' } as const;
  return new Intl.DateTimeFormat(copy.locale, format).format(date);
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
