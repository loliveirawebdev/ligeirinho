import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { InputGroup } from './input-group';

interface InputGroupPreviewModel {
  readonly label: string;
  readonly placeholder: string;
  readonly actionLabel: string;
  readonly busyActionLabel: string;
  readonly icon: string;
  readonly busy: boolean;
}

@Component({
  selector: 'ui-input-group-preview',
  imports: [InputGroup],
  template: `
    <div class="mx-auto max-w-2xl p-4 sm:p-8">
      <ui-input-group
        [label]="model().label"
        [placeholder]="model().placeholder"
        [actionLabel]="model().actionLabel"
        [busyActionLabel]="model().busyActionLabel"
        [icon]="model().icon"
        [busy]="model().busy"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class InputGroupPreview {
  readonly model = input.required<InputGroupPreviewModel>();
}

const invite: InputGroupPreviewModel = {
  label: 'Email',
  placeholder: 'name@company.com',
  actionLabel: 'Invite',
  busyActionLabel: 'Inviting…',
  icon: 'person_add',
  busy: false,
};

export const inputGroupScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Input group',
  component: InputGroupPreview,
  scenarios: {
    ready: invite,
    busy: { ...invite, busy: true },
    withoutIcon: { ...invite, icon: '', label: 'Search code', actionLabel: 'Apply', placeholder: '' },
  },
});
