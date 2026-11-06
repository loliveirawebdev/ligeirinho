export interface TaskRow {
  readonly id: string;
  readonly title: string;
  readonly done: boolean;
}

export interface TaskListViewModel {
  readonly heading: string;
  readonly tasks: readonly TaskRow[];
  readonly emptyMessage: string | null;
  readonly errorMessage: string | null;
}
