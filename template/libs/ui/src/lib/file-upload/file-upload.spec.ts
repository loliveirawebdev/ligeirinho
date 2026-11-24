import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { FileUpload, type UploadFile } from './file-upload';
import { FileUploadHarness } from './file-upload.harness';

const files: UploadFile[] = [
  { id: 'a', name: 'contract.pdf', size: 2_400_000, status: 'uploading', progress: 40 },
  { id: 'b', name: 'photo.jpg', size: 800_000, status: 'error', error: 'Upload failed. Try again.' },
  { id: 'c', name: 'invoice.pdf', size: 120_000, status: 'done' },
];

const inputs = {
  title: 'Drag files here or browse',
  browseLabel: 'Browse files',
  hint: 'PDF or images, up to 1 MB each',
  accept: '.pdf,image/*',
  multiple: true,
  maxSize: 1_000_000,
  tooLargeText: 'Larger than 1 MB',
  wrongTypeText: 'Not a PDF or an image',
  formatSize: (bytes: number) => `${String(Math.round(bytes / 1000))} kB`,
  listLabel: 'Files',
  removeLabel: 'Remove',
  retryLabel: 'Retry',
};

interface Events {
  readonly added: string[][];
  readonly removed: string[];
  readonly retried: string[];
}

async function setup(): Promise<{ upload: FileUploadHarness; zone: Element | null; events: Events }> {
  const events: Events = { added: [], removed: [], retried: [] };
  const { fixture } = await render(FileUpload, {
    inputs: { ...inputs, files },
    on: {
      filesAdded: (added: File[]) => events.added.push(added.map((file) => file.name)),
      removed: (id: string) => events.removed.push(id),
      retried: (id: string) => events.retried.push(id),
    },
  });
  const zone = document.querySelector('.ui-file-upload-zone');
  return { upload: await TestbedHarnessEnvironment.harnessForFixture(fixture, FileUploadHarness), zone, events };
}

function drop(zone: Element | null, dropped: File[]): void {
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files: dropped } });
  zone?.dispatchEvent(event);
}

describe('file upload', () => {
  it('lists the page’s files with their progress and errors, and asks to remove or retry them', async () => {
    const { upload, events } = await setup();
    expect(await upload.getTitle()).toBe('Drag files here or browse');
    expect(await upload.getHint()).toBe('PDF or images, up to 1 MB each');
    expect(await upload.getFileNames()).toEqual(['contract.pdf', 'photo.jpg', 'invoice.pdf']);
    expect(await (await upload.getFile('contract.pdf')).getProgress()).toBe(40);
    expect(await (await upload.getFile('photo.jpg')).getError()).toBe('Upload failed. Try again.');
    await (await upload.getFile('photo.jpg')).retry();
    await (await upload.getFile('invoice.pdf')).remove();
    expect(events.retried).toEqual(['b']);
    expect(events.removed).toEqual(['c']);
  });

  it('emits the files dropped that fit, and lists the rest with why until removed', async () => {
    const { upload, zone, events } = await setup();
    await upload.dragOver();
    expect(await upload.isDragOver()).toBe(true);
    drop(zone, [
      new File(['x'], 'notes.pdf', { type: 'application/pdf' }),
      new File([new Uint8Array(2_000_000)], 'scan.png', { type: 'image/png' }),
      new File(['x'], 'sheet.xlsx', { type: 'application/vnd.ms-excel' }),
    ]);
    expect(await upload.isDragOver()).toBe(false);
    expect(events.added).toEqual([['notes.pdf']]);
    expect(await (await upload.getFile('scan.png')).getError()).toBe('Larger than 1 MB');
    expect(await (await upload.getFile('sheet.xlsx')).getError()).toBe('Not a PDF or an image');
    await (await upload.getFile('scan.png')).remove();
    expect(await upload.getFileNames()).toEqual(['sheet.xlsx', 'contract.pdf', 'photo.jpg', 'invoice.pdf']);
    expect(events.removed).toEqual([]);
  });
});
