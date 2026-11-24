import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { defineScenarios } from '@ligeirinho/previewer';
import { DetailList, type DetailItem } from '../detail-list/detail-list';
import { Result, type ResultStatus } from './result';

interface ResultPreviewModel {
  readonly status: ResultStatus;
  readonly title: string;
  readonly message: string;
  readonly primaryAction: string;
  readonly secondaryAction?: string;
  readonly details?: readonly DetailItem[];
}

@Component({
  selector: 'ui-result-preview',
  imports: [DetailList, MatButtonModule, Result],
  template: `
    <ui-result [status]="model().status" [title]="model().title" [message]="model().message">
      <button uiResultActions matButton="filled" type="button">{{ model().primaryAction }}</button>
      @if (model().secondaryAction) {
        <button uiResultActions matButton="outlined" type="button">{{ model().secondaryAction }}</button>
      }
      @if (model().details; as details) {
        <ui-detail-list [items]="details" />
      }
    </ui-result>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ResultPreview {
  readonly model = input.required<ResultPreviewModel>();
}

export const resultScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Result',
  component: ResultPreview,
  scenarios: {
    /** A flow that went through, with its receipt under it. */
    success: {
      status: 'success',
      title: 'Payment received',
      message: 'We emailed the receipt to ana@northwind.example.',
      primaryAction: 'Go to invoices',
      secondaryAction: 'Download receipt',
      details: [
        { label: 'Amount', value: 'R$ 1.280,00' },
        { label: 'Invoice', value: 'INV-2026-0042' },
        { label: 'Paid on', value: '24 Nov 2026, 14:32' },
      ],
    },
    error: {
      status: 'error',
      title: 'The payment didn’t go through',
      message: 'Your card was declined. Nothing was charged. Try another card or contact your bank.',
      primaryAction: 'Try again',
      secondaryAction: 'Use another card',
    },
    expired: {
      status: 'warning',
      title: 'This link has expired',
      message: 'Invite links last 7 days. Ask whoever invited you to send a new one.',
      primaryAction: 'Go to sign in',
    },
    noAccess: {
      status: 'locked',
      title: 'You don’t have access to this page',
      message: 'Ask an administrator of Northwind to give you access.',
      primaryAction: 'Go home',
    },
    notFound: {
      status: 'not-found',
      title: 'This page doesn’t exist',
      message: 'Check the address, or go back to where you were.',
      primaryAction: 'Go home',
    },
  },
});
