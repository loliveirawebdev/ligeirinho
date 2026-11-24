import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EmptyState, InputGroup, LoadingState, Notice, PageHeader } from '@app/ui';
import type { TaskListViewModel } from './task-list.view-model';

@Component({
  selector: 'app-task-list-view',
  imports: [EmptyState, InputGroup, LoadingState, MatButtonModule, MatCheckboxModule, Notice, PageHeader],
  templateUrl: './task-list.view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListView {
  readonly model = input.required<TaskListViewModel>();

  readonly createTask = output<string>();
  readonly completeTask = output<string>();
  readonly loadMore = output();
  readonly retry = output();
}
