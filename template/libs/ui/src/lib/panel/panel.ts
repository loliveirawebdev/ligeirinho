import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

/**
 * A titled block of a dashboard or detail page: an outlined surface, its title and a line under it, its actions
 * (`uiPanelActions`) at the end of the header, its content under. With `split`, the content is other panels side by
 * side (`row`, stacked on phones) or one under the other (`column`), divided by lines inside one outline, like
 * Ant Design's ProCard: KPIs in a row, a chart beside its numbers, a list beside its detail.
 */
@Component({
  selector: 'ui-panel',
  templateUrl: './panel.html',
  styleUrl: './panel.css',
  // Panels inside a split lose their own outline; the rule reaches them, so every selector starts with ui-panel.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-panel',
    '[attr.data-split]': 'split() ?? null',
    '[style.flex-basis]': 'size() ?? null',
    '[style.flex-grow]': 'size() ? 0 : null',
  },
})
export class Panel {
  readonly title = input('');
  readonly subtitle = input('');
  /** The content is panels, divided by lines: side by side (`row`) or one under the other (`column`). */
  readonly split = input<'row' | 'column'>();
  /** Inside a split: this panel's share (`30%`, `320px`); the others share the rest equally. */
  readonly size = input<string>();
}
