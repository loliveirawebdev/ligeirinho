import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { HlmButtonImports } from '@app/ui/button';
import { HlmInputImports } from '@app/ui/input';
import { HlmLabelImports } from '@app/ui/label';
import type { TaskListViewModel } from './task-list.view-model';

@Component({
  selector: 'app-task-list-view',
  imports: [HlmButtonImports, HlmInputImports, HlmLabelImports, NgIcon],
  viewProviders: [provideIcons({ lucideCheck })],
  templateUrl: './task-list.view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListView {
  readonly model = input.required<TaskListViewModel>();

  readonly createTask = output<string>();
  readonly completeTask = output<string>();
  readonly loadMore = output();
  readonly retry = output();

  // Draft text is view-local UI state; it never leaves the view until the user submits.
  protected readonly newTaskTitle = signal('');

  protected updateNewTaskTitle(inputEvent: Event): void {
    const field = inputEvent.target;
    if (field instanceof HTMLInputElement) {
      this.newTaskTitle.set(field.value);
    }
  }

  protected submitNewTask(submitEvent: SubmitEvent): void {
    submitEvent.preventDefault();
    const title = this.newTaskTitle().trim();
    if (title === '') {
      return;
    }
    this.createTask.emit(title);
    this.newTaskTitle.set('');
  }
}
