import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

export interface PageBackLink {
  readonly label: string;
  readonly path: string;
}

/**
 * The top of every page: the title (the page's one `<h1>`), an optional line under it, an optional link back to the
 * parent page, and the page's actions (`uiPageActions`) under the title, at its start, on every screen size.
 */
@Component({
  selector: 'ui-page-header',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './page-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly supportingText = input('');
  readonly backLink = input<PageBackLink>();
}
