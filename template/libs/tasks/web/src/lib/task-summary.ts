/** A task as the front end receives it from GET /tasks (the API contract, not the domain entity). */
export interface TaskSummary {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
  readonly createdAt: string;
}

export interface TaskPage {
  readonly items: readonly TaskSummary[];
  readonly nextCursor?: string;
}
