import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ProfileCardViewModel } from './profile-card.view-model';

@Component({
  selector: 'demo-profile-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="profile-card">
      <h1>{{ model().displayName }}</h1>
      <p class="email">{{ model().email }}</p>
      @if (model().bio; as bio) {
        <p>{{ bio }}</p>
      }
      <button type="button" (click)="editProfile.emit()">Edit profile</button>
    </main>
  `,
  styles: `
    .profile-card { padding: 1rem; max-width: 40rem; margin: 0 auto; }
    .email { color: var(--demo-muted); overflow-wrap: anywhere; }
    button {
      min-height: 44px; padding: 0 1rem; border: 0; border-radius: 0.5rem;
      background: var(--demo-accent); color: var(--demo-accent-text); font: inherit; cursor: pointer;
    }
  `,
})
export class ProfileCardView {
  readonly model = input.required<ProfileCardViewModel>();
  readonly editProfile = output();
}
