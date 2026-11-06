import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import type { TaskListViewModel } from './task-list.view-model';

@Component({
  selector: 'app-task-list-view',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule],
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
