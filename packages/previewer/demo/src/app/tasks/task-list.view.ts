import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { TaskListViewModel } from './task-list.view-model';

@Component({
  selector: 'demo-task-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="task-list">
      <h1>{{ model().heading }}</h1>
      @if (model().errorMessage; as errorMessage) {
        <p role="alert">{{ errorMessage }}</p>
        <button type="button" (click)="retry.emit()">Try again</button>
      } @else if (model().emptyMessage; as emptyMessage) {
        <p>{{ emptyMessage }}</p>
      } @else {
        <ul>
          @for (task of model().tasks; track task.id) {
            <li>
              <span [class.done]="task.done">{{ task.title }}</span>
              <button
                type="button"
                [attr.aria-label]="(task.done ? 'Reopen: ' : 'Done: ') + task.title"
                (click)="toggleTask.emit(task.id)"
              >
                {{ task.done ? 'Reopen' : 'Done' }}
              </button>
            </li>
          }
        </ul>
      }
    </main>
  `,
  styles: `
    .task-list { padding: 1rem; max-width: 48rem; margin: 0 auto; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
    li {
      display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
      padding: 0.5rem 0.75rem; border: 1px solid var(--demo-border); border-radius: 0.5rem;
    }
    span { overflow-wrap: anywhere; }
    .done { text-decoration: line-through; color: var(--demo-muted); }
    button {
      min-height: 44px; min-width: 44px; padding: 0 1rem; border: 0; border-radius: 0.5rem;
      background: var(--demo-accent); color: var(--demo-accent-text); font: inherit; cursor: pointer;
    }
  `,
})
export class TaskListView {
  readonly model = input.required<TaskListViewModel>();
  readonly toggleTask = output<string>();
  readonly retry = output();
}
