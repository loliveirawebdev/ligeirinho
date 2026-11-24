import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { defineScenarios } from '@ligeirinho/previewer';
import { PageHeader, type PageBackLink } from './page-header';

interface PageHeaderPreviewModel {
  readonly title: string;
  readonly supportingText: string;
  readonly backLink?: PageBackLink;
  readonly primaryAction: string;
  readonly secondaryAction: string;
}

@Component({
  selector: 'ui-page-header-preview',
  imports: [MatButtonModule, MatIconModule, PageHeader],
  template: `
    <div class="mx-auto max-w-5xl p-4 sm:p-8">
      <ui-page-header [title]="model().title" [supportingText]="model().supportingText" [backLink]="model().backLink">
        @if (model().secondaryAction) {
          <button uiPageActions matButton="outlined" type="button">{{ model().secondaryAction }}</button>
        }
        @if (model().primaryAction) {
          <button uiPageActions matButton="filled" type="button">
            <mat-icon aria-hidden="true">person_add</mat-icon>
            {{ model().primaryAction }}
          </button>
        }
      </ui-page-header>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PageHeaderPreview {
  readonly model = input.required<PageHeaderPreviewModel>();
}

const members: PageHeaderPreviewModel = {
  title: 'Members',
  supportingText: '24 members, 3 invited',
  primaryAction: 'Invite member',
  secondaryAction: 'Export list',
};

export const pageHeaderScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Page header',
  component: PageHeaderPreview,
  scenarios: {
    withActions: members,
    titleOnly: { ...members, supportingText: '', primaryAction: '', secondaryAction: '' },
    withBackLink: {
      ...members,
      title: 'Ana Souza',
      supportingText: 'Member since March 2025',
      backLink: { label: 'Members', path: '/' },
      primaryAction: '',
      secondaryAction: 'Edit details',
    },
    longTitle: { ...members, title: 'Regional coordinators of the southern distribution network' },
  },
});
