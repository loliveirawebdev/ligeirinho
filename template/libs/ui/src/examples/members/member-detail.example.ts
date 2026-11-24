import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AppShell } from '../../lib/app-shell/app-shell';
import { DetailList, type DetailItem } from '../../lib/detail-list/detail-list';
import { Notice } from '../../lib/notice/notice';
import { PageHeader, type PageBackLink } from '../../lib/page-header/page-header';
import type { ExampleShell } from './member-list.example';

export interface DetailSection {
  readonly title: string;
  readonly items: readonly DetailItem[];
}

export interface MemberDetailExampleModel {
  readonly shell: ExampleShell;
  readonly backLink: PageBackLink;
  readonly name: string;
  readonly since: string;
  readonly editAction: string;
  readonly removeAction: string;
  readonly notice?: { readonly title: string; readonly message: string; readonly action: string };
  readonly sections: readonly DetailSection[];
}

/**
 * Screen pattern: one record of a back office. Back link, the record's name as the title with its actions, a
 * notice when something needs attention, then its facts in titled sections (space and a heading, no cards).
 */
@Component({
  selector: 'ui-member-detail-example',
  imports: [AppShell, DetailList, MatButtonModule, Notice, PageHeader],
  templateUrl: './member-detail.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberDetailExample {
  readonly model = input.required<MemberDetailExampleModel>();
}
