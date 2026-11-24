import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { type CheckCardOption, CheckCards } from './check-cards';

interface CheckCardsPreviewModel {
  readonly label: string;
  readonly options: readonly CheckCardOption[];
  readonly selected: readonly string[];
  readonly multiple?: boolean;
}

@Component({
  selector: 'ui-check-cards-preview',
  imports: [CheckCards],
  template: `
    <div class="mx-auto max-w-4xl p-4 sm:p-8">
      <ui-check-cards
        [label]="model().label"
        [options]="model().options"
        [multiple]="model().multiple ?? false"
        [selected]="selected()"
        (selectedChange)="selected.set($event)"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CheckCardsPreview {
  readonly model = input.required<CheckCardsPreviewModel>();
  protected readonly selected = signal<readonly string[]>([]);

  constructor() {
    effect(() => {
      this.selected.set(this.model().selected);
    });
  }
}

export const checkCardsScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Check cards',
  component: CheckCardsPreview,
  scenarios: {
    /** One plan at a time, its price at the end; one not available. */
    plans: {
      label: 'Plan',
      selected: ['business'],
      options: [
        { value: 'starter', title: 'Starter', description: 'Up to 5 people, 1 workspace', note: 'Free', icon: 'person' },
        { value: 'business', title: 'Business', description: 'Up to 50 people, shared views and reports', note: 'R$ 49/mo', icon: 'groups' },
        { value: 'enterprise', title: 'Enterprise', description: 'Unlimited people, SSO and audit log', note: 'Talk to us', icon: 'domain', disabled: true },
      ],
    },
    /** Several at once: what a role can do. */
    permissions: {
      label: 'Permissions',
      multiple: true,
      selected: ['view', 'edit'],
      options: [
        { value: 'view', title: 'View records', description: 'See every client and contract', icon: 'visibility' },
        { value: 'edit', title: 'Edit records', description: 'Change details and add notes', icon: 'edit' },
        { value: 'invite', title: 'Invite people', description: 'Send invites to the workspace', icon: 'person_add' },
        { value: 'billing', title: 'Manage billing', description: 'Change the plan and see invoices', icon: 'credit_card' },
      ],
    },
  },
});
