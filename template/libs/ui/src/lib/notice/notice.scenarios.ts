import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { defineScenarios } from '@ligeirinho/previewer';
import { Notice, type NoticeTone } from './notice';

interface NoticePreviewModel {
  readonly title: string;
  readonly message: string;
  /** The main action (outlined), if any. */
  readonly action: string;
  /** A second, quieter action (text button) before the main one, which ends the row, if any. */
  readonly secondaryAction: string;
}

/** Each scenario shows one variation in the three tones, one under the other. */
const TONES: readonly NoticeTone[] = ['neutral', 'success', 'error'];

@Component({
  selector: 'ui-notice-preview',
  imports: [MatButtonModule, Notice],
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-8">
      @for (tone of tones; track tone) {
        <ui-notice [tone]="tone" [title]="model().title" [message]="model().message">
          @if (model().secondaryAction) {
            <button uiNoticeAction matButton type="button">{{ model().secondaryAction }}</button>
          }
          @if (model().action) {
            <button uiNoticeAction matButton="outlined" type="button">{{ model().action }}</button>
          }
        </ui-notice>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NoticePreview {
  readonly model = input.required<NoticePreviewModel>();
  protected readonly tones = TONES;
}

const LONG_MESSAGE =
  'Members with the viewer role will no longer export lists. Administrators keep every permission. Review the roles before the change takes effect, so nobody loses access they still need.';

const titleOnly: NoticePreviewModel = { title: 'Changes saved', message: '', action: '', secondaryAction: '' };
const titleAndMessage: NoticePreviewModel = {
  title: 'Invitation pending',
  message: 'Ana Souza has not accepted the invitation yet. It expires in 4 days.',
  action: '',
  secondaryAction: '',
};
const longMessage: NoticePreviewModel = {
  title: 'Access will change on April 1',
  message: LONG_MESSAGE,
  action: '',
  secondaryAction: '',
};

export const noticeScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Notice',
  component: NoticePreview,
  scenarios: {
    titleOnly,
    titleAndMessage,
    longMessage,
    titleWithAction: { ...titleOnly, title: 'The members could not be loaded', action: 'Try again' },
    messageWithAction: { ...titleAndMessage, action: 'Resend invitation' },
    longMessageWithActions: { ...longMessage, action: 'Review roles', secondaryAction: 'Dismiss' },
  },
});
