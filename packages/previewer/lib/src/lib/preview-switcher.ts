import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { type ScenarioMatch, type ScenarioReference, searchScenarios } from './preview-workbench.state';
import type { PreviewEntrySummary } from './scenario-registry';

const MAXIMUM_MATCHES = 50;

/** ⌘K / Ctrl+K: jump to any scenario by typing parts of its flow, screen and name. */
@Component({
  selector: 'ligeirinho-preview-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preview-switcher.html',
  styleUrl: './preview-switcher.css',
})
export class PreviewSwitcher {
  readonly entries = input.required<readonly PreviewEntrySummary[]>();
  readonly chosen = output<ScenarioReference>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  protected readonly matches = computed(() => searchScenarios(this.entries(), this.query(), MAXIMUM_MATCHES));
  protected readonly activeId = computed(() =>
    this.matches().length === 0 ? null : optionId(this.activeIndex()),
  );

  open(): void {
    const dialog = this.dialog().nativeElement;
    if (dialog.open) {
      return;
    }
    this.query.set('');
    this.activeIndex.set(0);
    dialog.showModal();
    this.field().nativeElement.value = '';
    this.field().nativeElement.focus();
  }

  protected optionId(index: number): string {
    return optionId(index);
  }

  protected onInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.query.set(event.target.value);
      this.activeIndex.set(0);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.matches().length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (count > 0) {
        const step = event.key === 'ArrowDown' ? 1 : -1;
        this.activeIndex.update((index) => (index + step + count) % count);
        this.dialog().nativeElement.querySelector(`#${optionId(this.activeIndex())}`)?.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const match = this.matches()[this.activeIndex()];
      if (match !== undefined) {
        this.choose(match);
      }
    }
  }

  protected choose(match: ScenarioMatch): void {
    this.dialog().nativeElement.close();
    this.chosen.emit({ entryId: match.entryId, scenarioName: match.scenarioName });
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.dialog().nativeElement.close();
    }
  }
}

function optionId(index: number): string {
  return `ligeirinho-switcher-option-${index}`;
}
