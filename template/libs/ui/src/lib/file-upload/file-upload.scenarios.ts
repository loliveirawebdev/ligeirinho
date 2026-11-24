import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { FileUpload, type UploadFile } from './file-upload';

interface FileUploadPreviewModel {
  readonly title: string;
  readonly browseLabel: string;
  readonly hint: string;
  readonly accept: string;
  readonly multiple: boolean;
  readonly maxSize: number;
  readonly tooLargeText: string;
  readonly wrongTypeText: string;
  readonly listLabel: string;
  readonly removeLabel: string;
  readonly retryLabel: string;
  readonly uploadError: string;
  readonly files: readonly UploadFile[];
}

const TICK_MS = 300;
const STEP = 12;

function formatSize(bytes: number): string {
  return bytes < 1_000_000 ? `${String(Math.round(bytes / 1000))} kB` : `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/** Uploads as a page would: added files fill their bar and finish; *Retry* starts a failed one again. */
@Component({
  selector: 'ui-file-upload-preview',
  imports: [FileUpload],
  template: `
    <div class="mx-auto max-w-xl p-4 sm:p-8">
      <ui-file-upload
        [title]="model().title"
        [browseLabel]="model().browseLabel"
        [hint]="model().hint"
        [accept]="model().accept"
        [multiple]="model().multiple"
        [maxSize]="model().maxSize"
        [tooLargeText]="model().tooLargeText"
        [wrongTypeText]="model().wrongTypeText"
        [files]="files()"
        [formatSize]="formatSize"
        [listLabel]="model().listLabel"
        [removeLabel]="model().removeLabel"
        [retryLabel]="model().retryLabel"
        (filesAdded)="add($event)"
        (removed)="remove($event)"
        (retried)="retry($event)"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FileUploadPreview {
  readonly model = input.required<FileUploadPreviewModel>();
  protected readonly files = signal<readonly UploadFile[]>([]);
  protected readonly formatSize = formatSize;
  private nextId = 0;

  constructor() {
    effect(() => {
      this.files.set(this.model().files);
    });
    const timer = setInterval(() => {
      this.tick();
    }, TICK_MS);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
    });
  }

  protected add(added: File[]): void {
    const uploads = added.map((file): UploadFile => ({ id: `added-${String(this.nextId++)}`, name: file.name, size: file.size, status: 'uploading', progress: 0 }));
    this.files.update((files) => [...files, ...uploads]);
  }

  protected remove(id: string): void {
    this.files.update((files) => files.filter((file) => file.id !== id));
  }

  protected retry(id: string): void {
    this.files.update((files) => files.map((file) => (file.id === id ? { id: file.id, name: file.name, size: file.size, status: 'uploading', progress: 0 } : file)));
  }

  /** Moves every added or retried upload along; the scenario's own files stay as they are. */
  private tick(): void {
    this.files.update((files) =>
      files.map((file) => {
        if (file.status !== 'uploading' || file.progress === undefined || this.model().files.includes(file)) {
          return file;
        }
        const progress = Math.min(100, file.progress + STEP);
        return progress === 100 ? { ...file, status: 'done', progress } : { ...file, progress };
      }),
    );
  }
}

const base: FileUploadPreviewModel = {
  title: 'Drag files here or browse',
  browseLabel: 'Browse files',
  hint: 'PDF, PNG or JPG, up to 10 MB each',
  accept: '.pdf,image/png,image/jpeg',
  multiple: true,
  maxSize: 10_000_000,
  tooLargeText: 'Larger than 10 MB. Compress it or split it.',
  wrongTypeText: 'Not a PDF, PNG or JPG.',
  listLabel: 'Attachments',
  removeLabel: 'Remove',
  retryLabel: 'Retry',
  uploadError: 'Upload failed. Check your connection and retry.',
  files: [],
};

export const fileUploadScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'File upload',
  component: FileUploadPreview,
  scenarios: {
    /** Nothing yet: drop or pick files and watch them upload. */
    empty: base,
    /** One uploading, one with no known progress, one failed, one done; the long name truncates. */
    uploading: {
      ...base,
      files: [
        { id: 'contract', name: 'Northwind – service contract 2026, signed by both parties.pdf', size: 2_400_000, status: 'uploading', progress: 64 },
        { id: 'scan', name: 'id-scan.png', size: 830_000, status: 'uploading' },
        { id: 'photo', name: 'site-photo.jpg', size: 4_100_000, status: 'error', error: base.uploadError },
        { id: 'invoice', name: 'invoice-0425.pdf', size: 118_000, status: 'done' },
      ],
    },
    /** One file only, a spreadsheet import. */
    single: {
      ...base,
      title: 'Drag the spreadsheet here or browse',
      browseLabel: 'Choose file',
      hint: 'CSV, up to 5 MB',
      accept: '.csv',
      multiple: false,
      maxSize: 5_000_000,
      tooLargeText: 'Larger than 5 MB.',
      wrongTypeText: 'Not a CSV file.',
      files: [{ id: 'clients', name: 'clients.csv', size: 412_000, status: 'done' }],
    },
  },
});
