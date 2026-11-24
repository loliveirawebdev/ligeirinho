import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** What a catalog page says about a component: its name in code, then when to use it. */
export interface ExampleNoteText {
  readonly name: string;
  readonly use: string;
}

/** The catalog pages' note over each component: its name in code, then when to use it. */
@Component({
  selector: 'ui-example-note',
  template: `
    <div class="flex flex-col">
      <code class="text-label-large">{{ note().name }}</code>
      <span class="text-body-small text-on-surface-variant">{{ note().use }}</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleNote {
  readonly note = input.required<ExampleNoteText>();
}
