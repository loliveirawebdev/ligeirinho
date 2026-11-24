import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { Kbd } from './kbd';

interface KbdPreviewModel {
  readonly shortcuts: readonly { readonly action: string; readonly keys: readonly string[] }[];
}

@Component({
  selector: 'ui-kbd-preview',
  imports: [Kbd],
  template: `
    <dl class="grid max-w-sm grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 p-4 sm:p-8">
      @for (shortcut of model().shortcuts; track shortcut.action) {
        <dt class="text-body-medium">{{ shortcut.action }}</dt>
        <dd><ui-kbd [keys]="shortcut.keys" /></dd>
      }
    </dl>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class KbdPreview {
  readonly model = input.required<KbdPreviewModel>();
}

export const kbdScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Kbd',
  component: KbdPreview,
  scenarios: {
    shortcuts: {
      shortcuts: [
        { action: 'Search', keys: ['⌘', 'K'] },
        { action: 'New task', keys: ['N'] },
        { action: 'Command palette', keys: ['Ctrl', '⇧', 'P'] },
        { action: 'Close', keys: ['Esc'] },
      ],
    },
  },
});
