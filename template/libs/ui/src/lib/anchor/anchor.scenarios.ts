import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { Anchor, type AnchorItem } from './anchor';

interface AnchorSection {
  readonly id: string;
  readonly title: string;
  readonly level: 2 | 3;
  readonly paragraphs: readonly string[];
}

interface AnchorPreviewModel {
  readonly label: string;
  readonly title: string;
  readonly items: readonly AnchorItem[];
  readonly sections: readonly AnchorSection[];
}

@Component({
  selector: 'ui-anchor-preview',
  imports: [Anchor],
  template: `
    @let m = model();
    <div class="mx-auto grid max-w-5xl gap-8 p-4 sm:p-8 lg:grid-cols-[1fr_220px]">
      <article class="min-w-0">
        <h1 class="text-headline-small">{{ m.title }}</h1>
        @for (section of m.sections; track section.id) {
          <section class="scroll-mt-6" [id]="section.id" [class.mt-10]="section.level === 2" [class.mt-6]="section.level === 3">
            @if (section.level === 2) {
              <h2 class="text-title-large">{{ section.title }}</h2>
            } @else {
              <h3 class="text-title-medium">{{ section.title }}</h3>
            }
            @for (paragraph of section.paragraphs; track $index) {
              <p class="text-body-large mt-3 text-on-surface-variant">{{ paragraph }}</p>
            }
          </section>
        }
      </article>
      <!-- The column holds the anchor; the anchor sticks inside it. Hidden on phones, where the page is short enough to scroll. -->
      <div class="hidden lg:block">
        <ui-anchor [items]="m.items" [label]="m.label" />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AnchorPreview {
  readonly model = input.required<AnchorPreviewModel>();
}

const FILLER = [
  'The provider keeps the client portal available and answers support requests within one business day, with a named contact for each account and a monthly report of what was done.',
  'Changes requested after a release are scheduled for the next one; urgent fixes ship when they are ready, after the client confirms them in the staging environment.',
  'Each party names a person who approves the work, and either can ask for a review meeting with a week of notice when the plan needs to change.',
];

function section(id: string, title: string, level: 2 | 3 = 2): AnchorSection {
  return { id, title, level, paragraphs: level === 2 ? FILLER : FILLER.slice(0, 2) };
}

export const anchorScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Anchor',
  component: AnchorPreview,
  scenarios: {
    /** A long contract: scroll and the section being read is marked; click a link to scroll to it. Sticky beside the text. */
    contract: {
      label: 'On this page',
      title: 'Contract 2026',
      items: [
        { id: 'anchor-scope', label: 'Scope' },
        {
          id: 'anchor-terms',
          label: 'Terms',
          children: [
            { id: 'anchor-renewal', label: 'Renewal' },
            { id: 'anchor-cancellation', label: 'Cancellation' },
          ],
        },
        { id: 'anchor-payment', label: 'Payment' },
        { id: 'anchor-support', label: 'Support' },
      ],
      sections: [
        section('anchor-scope', 'Scope'),
        section('anchor-terms', 'Terms'),
        section('anchor-renewal', 'Renewal', 3),
        section('anchor-cancellation', 'Cancellation', 3),
        section('anchor-payment', 'Payment'),
        section('anchor-support', 'Support'),
      ],
    },
  },
});
