import { defineScenarios } from '@ligeirinho/previewer';
import { FeedbackExample, type FeedbackExampleModel } from './feedback.example';

const feedback: FeedbackExampleModel = {
  title: 'Feedback and overlays',
  sections: { overlays: 'Dialogs, sheets and snack bars', progress: 'Progress', hints: 'Tooltips and badges' },
  notes: {
    dialog: {
      name: 'ConfirmDialogs (ui-confirm-dialog)',
      use: 'Confirms a destructive action: the question, what happens, Cancel and the verb with its object. Other dialogs: ui-dialog, ui-form-dialog',
    },
    bottomSheet: { name: 'MatBottomSheet', use: 'A few actions from the bottom of a phone screen' },
    snackBar: { name: 'MatSnackBar', use: 'The result of an action, with Undo when it can be undone; never a banner' },
    progressBar: {
      name: 'mat-progress-bar',
      use: 'Progress of a known length, or indeterminate; a page that loads is ui-loading-state',
    },
    progressBuffer: { name: 'mat-progress-bar mode="buffer"', use: 'An upload or a stream: done and received' },
    spinner: { name: 'mat-progress-spinner', use: 'Waiting in a small place (a panel, a row)' },
    spinnerButton: { name: 'diameter="18" in a button', use: 'The button that started the work, disabled while it runs' },
    tooltip: { name: 'matTooltip', use: 'The name of an icon button, on hover and focus; never essential text' },
    badge: { name: 'matBadge on the mat-icon', use: 'A count on an icon (99+ past that), or a dot with matBadgeSize="small"' },
  },
  dialog: {
    open: 'Remove member…',
    title: 'Remove Ana Souza?',
    message: 'She loses access to the workspace right away. Her work stays.',
    cancel: 'Cancel',
    confirm: 'Remove member',
  },
  bottomSheet: {
    open: 'Share…',
    items: [
      { icon: 'link', label: 'Copy link' },
      { icon: 'mail', label: 'Send by email' },
      { icon: 'download', label: 'Download PDF' },
    ],
  },
  snackBar: { trigger: 'Archive invoice', message: 'Invoice archived', undo: 'Undo' },
  progress: { label: 'Importing members', value: 40, buffer: 70, saving: 'Saving…' },
  tooltips: [
    { icon: 'edit', label: 'Edit', position: 'below' },
    { icon: 'content_copy', label: 'Copy', position: 'above' },
    { icon: 'delete', label: 'Delete', position: 'right' },
  ],
  badges: {
    items: [
      { icon: 'notifications', label: 'Notifications, 3 unread', count: 3 },
      { icon: 'mail', label: 'Inbox, more than 99 unread', count: '99+' },
      { icon: 'chat', label: 'Messages, new' },
    ],
  },
};

export const feedbackScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Feedback and overlays',
  component: FeedbackExample,
  scenarios: { all: feedback },
});
