/**
 * Messages the render page (inside the workbench's iframe) posts to the workbench: the steps of a scenario's
 * `play` function and the outputs the view emits. Same origin only.
 */
export type PreviewStepStatus = 'running' | 'done' | 'failed';

export type PreviewMessage =
  | { readonly source: typeof PREVIEW_MESSAGE_SOURCE; readonly kind: 'reset' }
  | {
      readonly source: typeof PREVIEW_MESSAGE_SOURCE;
      readonly kind: 'step';
      readonly index: number;
      readonly label: string;
      readonly status: PreviewStepStatus;
      readonly error?: string;
    }
  | { readonly source: typeof PREVIEW_MESSAGE_SOURCE; readonly kind: 'output'; readonly name: string; readonly value: string };

export const PREVIEW_MESSAGE_SOURCE = 'ligeirinho-preview';

export function isPreviewMessage(candidate: unknown): candidate is PreviewMessage {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    'source' in candidate &&
    candidate.source === PREVIEW_MESSAGE_SOURCE &&
    'kind' in candidate &&
    typeof candidate.kind === 'string'
  );
}

/** A short, readable form of an emitted value for the Events panel and the console. */
export function describeValue(value: unknown): string {
  if (value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
