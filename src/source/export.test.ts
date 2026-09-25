// @vitest-environment jsdom
import { vi } from 'vitest';
import { APP_VERSION } from '../version';
import { buildExportPayload, showExportDialog } from './export';

async function flushAsyncEvents() {
  await Promise.resolve();
  await Promise.resolve();
}

const personData = {
  infos: [{ name: '姓名', value: '折戸伸治', category: 'crt_name' }],
};

function buildPersonPayload() {
  return buildExportPayload({
    kind: 'person',
    site: 'vgmdb_artist',
    sourceUrl: 'https://vgmdb.net/artist/2',
    data: personData,
    exportedAt: new Date('2026-09-25T00:00:00Z'),
  });
}

describe('buildExportPayload', () => {
  test('wraps extracted data in a versioned envelope', () => {
    expect(buildPersonPayload()).toEqual({
      format: 'bnwh-export/1',
      helperVersion: APP_VERSION,
      kind: 'person',
      site: 'vgmdb_artist',
      sourceUrl: 'https://vgmdb.net/artist/2',
      exportedAt: '2026-09-25T00:00:00.000Z',
      data: personData,
    });
  });

  test('keeps subject type and subtype inside data', () => {
    const payload = buildExportPayload({
      kind: 'subject',
      site: 'dmm',
      sourceUrl: 'https://dlsoft.dmm.co.jp/detail/demo/',
      data: { type: 4, subtype: 0, infos: [] },
    });

    expect(payload.kind).toBe('subject');
    expect(payload.data).toEqual({ type: 4, subtype: 0, infos: [] });
    expect(new Date(payload.exportedAt).getTime()).not.toBeNaN();
  });
});

describe('showExportDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  test('renders the payload as pretty JSON in a read-only textarea', () => {
    const payload = buildPersonPayload();

    showExportDialog(payload);

    const dialog = document.querySelector<HTMLDialogElement>(
      'dialog.e-bnwh-export-dialog'
    )!;
    const textarea = dialog.querySelector<HTMLTextAreaElement>(
      'textarea.e-bnwh-export-json'
    )!;
    expect(dialog.open).toBe(true);
    expect(dialog.dataset.kind).toBe('person');
    expect(textarea.readOnly).toBe(true);
    expect(textarea.value).toBe(JSON.stringify(payload, null, 2));
  });

  test('reuses a single dialog and replaces its content on the next export', () => {
    showExportDialog(buildPersonPayload());
    const next = buildExportPayload({
      kind: 'subject',
      site: 'dmm',
      sourceUrl: 'https://dlsoft.dmm.co.jp/detail/demo/',
      data: { type: 4, subtype: 0, infos: [] },
    });

    showExportDialog(next);

    const dialogs = document.querySelectorAll('dialog.e-bnwh-export-dialog');
    expect(dialogs).toHaveLength(1);
    expect(dialogs[0].getAttribute('data-kind')).toBe('subject');
    expect(
      dialogs[0].querySelector<HTMLTextAreaElement>('textarea.e-bnwh-export-json')!
        .value
    ).toBe(JSON.stringify(next, null, 2));
  });

  test('download button saves the JSON under a descriptive file name', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:bnwh');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
    let downloadName = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloadName = this.getAttribute('download') ?? '';
    });
    const payload = buildPersonPayload();
    showExportDialog(payload);

    document
      .querySelector<HTMLElement>('.e-bnwh-export-download')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(downloadName).toBe('bnwh-person-vgmdb_artist-20260925T000000Z.json');
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:bnwh');
  });

  test('copy button writes the JSON to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const payload = buildPersonPayload();
    showExportDialog(payload);
    const copyButton = document.querySelector<HTMLElement>('.e-bnwh-export-copy')!;

    copyButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(writeText).toHaveBeenCalledWith(JSON.stringify(payload, null, 2));
    expect(copyButton.textContent).toBe('已复制');
  });

  test('close button closes the dialog', () => {
    showExportDialog(buildPersonPayload());
    const dialog = document.querySelector<HTMLDialogElement>(
      'dialog.e-bnwh-export-dialog'
    )!;

    dialog
      .querySelector<HTMLElement>('.e-bnwh-export-close')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(dialog.open).toBe(false);
  });
});
