import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface DetailItem {
  readonly label: string;
  readonly value: string;
}

/**
 * The facts of one record, label beside value on wide screens and above it on phones. A label is the same word the
 * form that collected the value used (one copy key for both, rules/copy.md).
 */
@Component({
  selector: 'ui-detail-list',
  templateUrl: './detail-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class DetailList {
  readonly items = input.required<readonly DetailItem[]>();
  /** Keep each label and value on one line, cut with an ellipsis; by default they wrap as far as they need. */
  readonly truncate = input(false);
}
