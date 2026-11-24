import { type BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatProgressBarHarness } from '@angular/material/progress-bar/testing';

/** One file in a `ui-file-upload`'s list. */
export class FileUploadItemHarness extends ComponentHarness {
  static readonly hostSelector = '.ui-file-upload-file';

  /** Finds a file by its name. */
  static with(options: BaseHarnessFilters & { readonly name?: string } = {}): HarnessPredicate<FileUploadItemHarness> {
    return new HarnessPredicate(FileUploadItemHarness, options).addOption('name', options.name, async (item, name) => (await item.getName()) === name);
  }

  private readonly name = this.locatorFor('.ui-file-upload-name');
  private readonly error = this.locatorForOptional('.ui-file-upload-error');
  private readonly bar = this.locatorForOptional(MatProgressBarHarness);
  private readonly removeButton = this.locatorFor('.ui-file-upload-remove');
  private readonly retryButton = this.locatorForOptional('.ui-file-upload-retry');

  async getName(): Promise<string> {
    return (await this.name()).text();
  }

  /** Why it failed or was refused, or null. */
  async getError(): Promise<string | null> {
    return (await (await this.error())?.text()) ?? null;
  }

  /** 0 to 100 while uploading; null when it isn't uploading or its progress isn't known. */
  async getProgress(): Promise<number | null> {
    return (await (await this.bar())?.getValue()) ?? null;
  }

  async remove(): Promise<void> {
    await (await this.removeButton()).click();
  }

  async retry(): Promise<void> {
    await (await this.retryButton())?.click();
  }
}

/** Reads and drives a `ui-file-upload` in tests. Files are dropped or picked from the DOM: a harness can't carry `File`s. */
export class FileUploadHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-file-upload';

  private readonly zone = this.locatorFor('.ui-file-upload-zone');
  private readonly title = this.locatorFor('.ui-file-upload-title');
  private readonly hint = this.locatorForOptional('.ui-file-upload-hint');
  private readonly items = this.locatorForAll(FileUploadItemHarness);

  async getTitle(): Promise<string> {
    return (await this.title()).text();
  }

  async getHint(): Promise<string> {
    return (await (await this.hint())?.text()) ?? '';
  }

  /** Files are being dragged over the dropzone. */
  async isDragOver(): Promise<boolean> {
    return (await this.zone()).hasClass('ui-file-upload-over');
  }

  async dragOver(): Promise<void> {
    await (await this.zone()).dispatchEvent('dragover');
  }

  /** The files listed by name, refused ones first. */
  async getFileNames(): Promise<string[]> {
    return Promise.all((await this.items()).map((item) => item.getName()));
  }

  /** A listed file, by name; fails when it isn't listed. */
  async getFile(name: string): Promise<FileUploadItemHarness> {
    return this.locatorFor(FileUploadItemHarness.with({ name }))();
  }
}
