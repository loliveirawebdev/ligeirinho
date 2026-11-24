import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { Avatar, AvatarGroup, type AvatarPerson, type AvatarSize } from './avatar';

interface AvatarPreviewModel {
  readonly people: readonly AvatarPerson[];
  readonly sizes: readonly AvatarSize[];
  readonly groupLabel: string;
}

/** A photo drawn in place, so the preview needs nothing from the network. */
const PHOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#8aa4c8"/><circle cx="20" cy="16" r="7" fill="#e8eef7"/><ellipse cx="20" cy="36" rx="13" ry="10" fill="#e8eef7"/></svg>',
  );

@Component({
  selector: 'ui-avatar-preview',
  imports: [Avatar, AvatarGroup],
  template: `
    <div class="flex flex-col gap-6 p-4 sm:p-8">
      @for (size of model().sizes; track size) {
        <div class="flex items-center gap-3">
          @for (person of model().people; track person.name) {
            <ui-avatar [name]="person.name" [image]="person.image" [size]="size" />
          }
        </div>
      }
      <ui-avatar-group [people]="model().people" [label]="model().groupLabel" [max]="4" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AvatarPreview {
  readonly model = input.required<AvatarPreviewModel>();
}

export const avatarScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Avatar',
  component: AvatarPreview,
  scenarios: {
    /** Small, medium and large; initials in the color their name picks, a photo; then the group, 4 at most. */
    all: {
      sizes: ['small', 'medium', 'large'],
      people: [
        { name: 'Ana Souza' },
        { name: 'Bruno Lima', image: PHOTO },
        { name: 'Carla Méndez' },
        { name: 'Diego Silva' },
        { name: 'Elena García' },
        { name: 'Fábio Rocha' },
      ],
      groupLabel: 'Ana Souza, Bruno Lima, Carla Méndez and 3 more',
    },
  },
});
