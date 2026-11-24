import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  readonly label: string;
  /** Where it goes (a router link); the last item, the page itself, has none. */
  readonly link?: string | readonly unknown[];
}

/**
 * Where the page sits, for deep pages of a back office (*Clients › Northwind › Contract 2026*): every level a link,
 * the last one the page itself. Above `ui-page-header`'s title; a page one level down only needs the header's back
 * link.
 */
@Component({
  selector: 'ui-breadcrumb',
  imports: [MatIconModule, RouterLink],
  templateUrl: './breadcrumb.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class Breadcrumb {
  readonly items = input.required<readonly BreadcrumbItem[]>();
  /** What the trail is, for screen readers: *Breadcrumb*. */
  readonly label = input.required<string>();
}
