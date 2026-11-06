import { ChangeDetectionStrategy, Component, computed, inject, signal, type OnInit } from '@angular/core';
import type { TaskSummary } from '../task-summary';
import { TasksApiClient } from '../tasks-api.client';
import { TaskListView } from './task-list.view';
import { buildTaskListViewModel, type TaskListStatus } from './task-list.view-model';

/** Thin page: fetches, keeps state in signals, builds the view-model and wires the view's intents. */
@Component({
  selector: 'app-task-list-page',
  imports: [TaskListView],
  template: `<app-task-list-view
    [model]="viewModel()"
    (createTask)="createTask($event)"
    (completeTask)="completeTask($event)"
    (loadMore)="loadNextPage()"
    (retry)="loadFirstPage()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListPage implements OnInit {
  private readonly tasksApiClient = inject(TasksApiClient);

  private readonly status = signal<TaskListStatus>('loading');
  private readonly tasks = signal<readonly TaskSummary[]>([]);
  private readonly nextCursor = signal<string | undefined>(undefined);
  private readonly isCreatingTask = signal(false);

  protected readonly viewModel = computed(() =>
    buildTaskListViewModel({
      status: this.status(),
      tasks: this.tasks(),
      hasMorePages: this.nextCursor() !== undefined,
      isCreatingTask: this.isCreatingTask(),
    }),
  );

  ngOnInit(): void {
    void this.loadFirstPage();
  }

  protected async loadFirstPage(): Promise<void> {
    this.status.set('loading');
    this.tasks.set([]);
    await this.appendPage(undefined);
  }

  protected async loadNextPage(): Promise<void> {
    await this.appendPage(this.nextCursor());
  }

  protected async createTask(title: string): Promise<void> {
    this.isCreatingTask.set(true);
    try {
      const createdTask = await this.tasksApiClient.createTask(title);
      this.tasks.update((currentTasks) => [createdTask, ...currentTasks]);
    } finally {
      this.isCreatingTask.set(false);
    }
  }

  protected async completeTask(taskId: string): Promise<void> {
    const completedTask = await this.tasksApiClient.completeTask(taskId);
    this.tasks.update((currentTasks) => currentTasks.map((task) => (task.id === taskId ? completedTask : task)));
  }

  private async appendPage(cursor: string | undefined): Promise<void> {
    try {
      const page = await this.tasksApiClient.listTasks(cursor);
      this.tasks.update((currentTasks) => [...currentTasks, ...page.items]);
      this.nextCursor.set(page.nextCursor);
      this.status.set('ready');
    } catch {
      // The failure is shown to the user as the "failed" state, with a retry button.
      this.status.set('failed');
    }
  }
}
