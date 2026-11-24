import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { MentionInput, type MentionPerson } from './mention-input';

interface MentionInputPreviewModel {
  readonly label: string;
  readonly suggestionsLabel: string;
  readonly hint?: string;
  readonly people: readonly MentionPerson[];
  readonly value: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'ui-mention-input-preview',
  imports: [MentionInput],
  template: `
    <div class="max-w-xl p-4 sm:p-8">
      <ui-mention-input
        [label]="model().label"
        [suggestionsLabel]="model().suggestionsLabel"
        [hint]="model().hint ?? ''"
        [people]="model().people"
        [disabled]="model().disabled ?? false"
        [(value)]="value"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MentionInputPreview {
  readonly model = input.required<MentionInputPreviewModel>();
  /** Played as a page would: the text typed stays. */
  protected readonly value = signal('');

  constructor() {
    effect(() => {
      this.value.set(this.model().value);
    });
  }
}

const PEOPLE: readonly MentionPerson[] = [
  { id: 'ana', name: 'Ana Souza', secondary: 'Product design' },
  { id: 'bruno', name: 'Bruno Lima', secondary: 'Finance' },
  { id: 'carla', name: 'Carla Dias', secondary: 'Customer success' },
  { id: 'davi', name: 'Davi Rocha', secondary: 'Engineering' },
  { id: 'joana', name: 'Joana Prado', secondary: 'Legal' },
  { id: 'fabio', name: 'Fábio Nunes' },
];

const comment: MentionInputPreviewModel = {
  label: 'Comment',
  suggestionsLabel: 'People',
  hint: 'Type @ to mention someone',
  people: PEOPLE,
  value: '',
};

export const mentionInputScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Mention input',
  component: MentionInputPreview,
  scenarios: {
    /** Empty: type @ to see the suggestions. */
    empty: comment,
    /** A comment that already mentions two people. */
    written: { ...comment, value: '@Ana Souza can you check the contract with @Bruno Lima before Friday? ' },
    disabled: { ...comment, value: 'Approved by @Joana Prado ', disabled: true },
  },
});
