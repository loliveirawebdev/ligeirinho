import { ChangeDetectionStrategy, Component, computed, input, output, signal, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/** A file the page is uploading, or has uploaded. */
export interface UploadFile {
  readonly id: string;
  readonly name: string;
  /** In bytes; shown through `formatSize`. */
  readonly size: number;
  /** 0 to 100 while uploading; without it, the bar runs without an end. */
  readonly progress?: number;
  readonly status: 'uploading' | 'done' | 'error';
  /** Why it failed and what to do: *Upload failed. Try again.* */
  readonly error?: string;
}

/** A file refused before uploading (too large, not an accepted type), listed with why until removed. */
interface RejectedFile {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly error: string;
}

let nextUpload = 0;

/** `accept` as the file picker reads it: `.pdf`, `image/*`, `application/pdf`. */
function isAccepted(file: File, accept: string): boolean {
  const kinds = accept.split(',').map((kind) => kind.trim().toLowerCase()).filter(Boolean);
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    kinds.length === 0 ||
    kinds.some((kind) => (kind.startsWith('.') ? name.endsWith(kind) : kind.endsWith('/*') ? type.startsWith(kind.slice(0, -1)) : type === kind))
  );
}

/**
 * Adds files to a record (attachments, an import, photos): a dropzone with a real file picker behind its button,
 * then the files as they upload, each with its size, a progress bar, and *Remove* or, when it failed, *Retry*.
 * Files too large (`maxSize`) or of another type (`accept`, also checked on drop) are listed with why and never
 * emitted. The page uploads what `filesAdded` gives it and passes each file's progress back in `files`.
 */
@Component({
  selector: 'ui-file-upload',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class FileUpload {
  /** *Drag files here or browse*. */
  readonly title = input.required<string>();
  /** The button that opens the file picker: *Browse files*. */
  readonly browseLabel = input.required<string>();
  /** What is accepted: *PDF or images, up to 10 MB each*. */
  readonly hint = input('');
  /** As the file input's `accept`: `.pdf,image/*`. */
  readonly accept = input('');
  readonly multiple = input(false);
  /** In bytes; larger files are refused with `tooLargeText`. */
  readonly maxSize = input<number>();
  /** Under a refused file: *Larger than 10 MB*. */
  readonly tooLargeText = input('');
  /** Under a refused file: *Not a PDF or an image*. */
  readonly wrongTypeText = input('');
  /** The page's files, with their progress. */
  readonly files = input<readonly UploadFile[]>([]);
  /** Bytes as people read them, from the view-model: *2.4 MB*. */
  readonly formatSize = input.required<(bytes: number) => string>();
  /** The list's name for screen readers: *Files*. */
  readonly listLabel = input.required<string>();
  /** The remove button's name; the file's name is read after it. */
  readonly removeLabel = input.required<string>();
  readonly retryLabel = input.required<string>();

  readonly filesAdded = output<File[]>();
  readonly removed = output<string>();
  readonly retried = output<string>();

  protected readonly baseId = `ui-file-upload-${String(nextUpload++)}`;
  protected readonly over = signal(false);
  protected readonly rejected = signal<readonly RejectedFile[]>([]);
  protected readonly hasFiles = computed(() => this.files().length + this.rejected().length > 0);

  protected dragOver(event: DragEvent): void {
    event.preventDefault();
    this.over.set(true);
  }

  protected dragLeave(event: DragEvent): void {
    if (!(event.relatedTarget instanceof Node && event.currentTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
      this.over.set(false);
    }
  }

  protected drop(event: DragEvent): void {
    event.preventDefault();
    this.over.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.add(this.multiple() ? files : files.slice(0, 1));
  }

  protected pick(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.add(Array.from(event.target.files ?? []));
      event.target.value = '';
    }
  }

  protected dismiss(id: string): void {
    this.rejected.update((rejected) => rejected.filter((file) => file.id !== id));
  }

  private add(files: readonly File[]): void {
    const accepted: File[] = [];
    const rejected: RejectedFile[] = [];
    for (const file of files) {
      const error = this.problem(file);
      if (error === undefined) {
        accepted.push(file);
      } else {
        rejected.push({ id: `${this.baseId}-rejected-${String(nextUpload++)}`, name: file.name, size: file.size, error });
      }
    }
    this.rejected.update((current) => [...current, ...rejected]);
    if (accepted.length > 0) {
      this.filesAdded.emit(accepted);
    }
  }

  private problem(file: File): string | undefined {
    if (!isAccepted(file, this.accept())) {
      return this.wrongTypeText();
    }
    const maxSize = this.maxSize();
    return maxSize !== undefined && file.size > maxSize ? this.tooLargeText() : undefined;
  }
}
