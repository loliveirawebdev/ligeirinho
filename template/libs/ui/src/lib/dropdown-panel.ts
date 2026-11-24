import type { ConnectedPosition } from '@angular/cdk/overlay';

/** A panel that drops from a field: under it, 4 px apart, or above it when there is no room below. */
export const DROPDOWN_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
];

const OPENING_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', ' '];

/** The keys that open a select-like field's panel, as on a native select; it takes the key from the page. */
export function opensPanel(event: KeyboardEvent): boolean {
  if (!OPENING_KEYS.includes(event.key)) {
    return false;
  }
  event.preventDefault();
  return true;
}
