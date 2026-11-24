import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AvatarSize = 'small' | 'medium' | 'large';

export interface AvatarPerson {
  /** Full name: the initials come from it, and screen readers read it. */
  readonly name: string;
  /** A photo; the initials show without it. */
  readonly image?: string;
}

const SIZES: Readonly<Record<AvatarSize, { readonly box: string; readonly font: string }>> = {
  small: { box: '24px', font: 'var(--mat-sys-label-small)' },
  medium: { box: '32px', font: 'var(--mat-sys-label-medium)' },
  large: { box: '40px', font: 'var(--mat-sys-title-small)' },
};

/**
 * The containers initials take, picked by the name, so a person keeps the same color on every screen. The app's own
 * tones join Material's (tertiary is the primary here), so people next to each other rarely match.
 */
const PRIMARY = { background: 'var(--mat-sys-primary-container)', color: 'var(--mat-sys-on-primary-container)' };
const COLORS: readonly { readonly background: string; readonly color: string }[] = [
  PRIMARY,
  { background: 'var(--app-success-container)', color: 'var(--app-on-success-container)' },
  { background: 'var(--app-warning-container)', color: 'var(--app-on-warning-container)' },
  { background: 'var(--mat-sys-secondary-container)', color: 'var(--mat-sys-on-secondary-container)' },
  { background: 'var(--mat-sys-surface-container-highest)', color: 'var(--mat-sys-on-surface-variant)' },
];

/** *Ana Souza* → *AS*; *Ana* → *A*. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

function colorOf(name: string): { readonly background: string; readonly color: string } {
  let sum = 0;
  for (const char of name) {
    sum += char.codePointAt(0) ?? 0;
  }
  return COLORS[sum % COLORS.length] ?? PRIMARY;
}

/**
 * A person, as a photo or their initials in a circle. Beside their written name it is decoration (`decorative`);
 * alone (a row of people, a top bar) it is read by their name.
 */
@Component({
  selector: 'ui-avatar',
  templateUrl: './avatar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full align-middle select-none',
    '[style.font]': 'look().font',
    '[style.width]': 'look().box',
    '[style.height]': 'look().box',
    '[style.background]': 'color().background',
    '[style.color]': 'color().color',
    '[attr.role]': 'decorative() ? null : "img"',
    '[attr.aria-label]': 'decorative() ? null : name()',
    '[attr.aria-hidden]': 'decorative() || null',
  },
})
export class Avatar {
  readonly name = input.required<string>();
  readonly image = input<string>();
  readonly size = input<AvatarSize>('medium');
  /** The name is written right beside it: screen readers skip the avatar. */
  readonly decorative = input(false, { transform: booleanAttribute });

  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly look = computed(() => SIZES[this.size()]);
  protected readonly color = computed(() => colorOf(this.name()));
}

/**
 * A few people together (who is assigned, who is here): overlapping avatars, the first `max`, then *+3*. Read as one
 * thing, in the screen's words (`label`: *Ana Souza, Bruno Lima and 3 more*).
 */
@Component({
  selector: 'ui-avatar-group',
  imports: [Avatar],
  templateUrl: './avatar-group.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center align-middle', role: 'img', '[attr.aria-label]': 'label()' },
})
export class AvatarGroup {
  readonly people = input.required<readonly AvatarPerson[]>();
  /** Everyone in the group, for screen readers. */
  readonly label = input.required<string>();
  readonly size = input<AvatarSize>('medium');
  /** How many avatars show before the *+N*. */
  readonly max = input(4);

  protected readonly shown = computed(() => {
    const people = this.people();
    return people.length > this.max() ? people.slice(0, this.max() - 1) : people;
  });
  protected readonly hidden = computed(() => this.people().length - this.shown().length);
  protected readonly box = computed(() => SIZES[this.size()]);
}
