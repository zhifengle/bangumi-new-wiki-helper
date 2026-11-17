// @vitest-environment jsdom
import { vi } from 'vitest';
import { APP_VERSION } from '../version';
import {
  buildExportPayload,
  clearDebugSources,
  inspectExportPayload,
  openDebugSource,
  showExportDialog,
} from './export';

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

function debugRoot() {
  return document.querySelector<HTMLElement>('.e-bnwh-debug-host')!.shadowRoot!;
}

function debugDialog() {
  return debugRoot().querySelector<HTMLDialogElement>('.e-bnwh-debug-dialog')!;
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
    clearDebugSources();
    vi.restoreAllMocks();
  });

  test('renders the payload as searchable fields and pretty JSON', () => {
    const payload = buildPersonPayload();

    showExportDialog(payload);

    const dialog = debugDialog();
    const textarea = dialog.querySelector<HTMLTextAreaElement>(
      'textarea.e-bnwh-debug-json'
    )!;
    expect(dialog.open).toBe(true);
    expect(textarea.readOnly).toBe(true);
    expect(textarea.value).toBe(JSON.stringify(payload, null, 2));
    expect(dialog.querySelector('tbody')?.textContent).toContain('折戸伸治');
    expect(dialog.querySelector('.e-bnwh-debug-findings')?.getAttribute('data-level'))
      .toBe('ok');
  });

  test('summarizes cover data in the field table and report but keeps the original JSON', async () => {
    const url = 'https://example.com/cover.jpg';
    const imageData = 'ABCD'.repeat(50_000);
    const dataUrl = `data:image/jpeg;base64,${imageData}`;
    const payload = buildExportPayload({
      kind: 'person',
      site: 'vgmdb_artist',
      sourceUrl: 'https://vgmdb.net/artist/2',
      data: {
        infos: [
          { name: '封面', category: 'crt_cover', value: { url, dataUrl } },
          ...personData.infos,
        ],
      },
    });

    showExportDialog(payload);

    const fields = debugRoot().querySelector('tbody')!.textContent;
    expect(fields).toContain(url);
    expect(fields).toContain('[Data URL · 195.3 KB · 已省略]');
    expect(fields).not.toContain(imageData.slice(0, 80));
    expect(fields).toContain('折戸伸治');
    expect(debugRoot().querySelector('textarea')!.value).toBe(JSON.stringify(payload, null, 2));

    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    try {
      debugRoot().querySelector<HTMLButtonElement>('.e-bnwh-debug-copy-report')!.click();
      debugRoot().querySelector<HTMLButtonElement>('.e-bnwh-debug-copy-json')!.click();
      await flushAsyncEvents();

      const [[report], [rawJson]] = writeText.mock.calls;
      expect(report).toContain(url);
      expect(report).toContain('[Data URL · 195.3 KB · 已省略]');
      expect(report).not.toContain(imageData.slice(0, 80));
      expect(rawJson).toBe(JSON.stringify(payload, null, 2));
    } finally {
      vi.unstubAllGlobals();
    }
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

    const dialogs = debugRoot().querySelectorAll('dialog.e-bnwh-debug-dialog');
    expect(dialogs).toHaveLength(1);
    expect(
      dialogs[0].querySelector<HTMLTextAreaElement>('textarea.e-bnwh-debug-json')!
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

    debugRoot()
      .querySelector<HTMLElement>('.e-bnwh-debug-download')!
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
    const copyButton = debugRoot().querySelector<HTMLElement>('.e-bnwh-debug-copy-json')!;

    copyButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(writeText).toHaveBeenCalledWith(JSON.stringify(payload, null, 2));
    expect(copyButton.textContent).toBe('已复制');
  });

  test('close button closes the dialog', () => {
    showExportDialog(buildPersonPayload());
    const dialog = debugDialog();

    dialog
      .querySelector<HTMLElement>('.e-bnwh-debug-close-icon')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(dialog.open).toBe(false);
  });

  test('keeps extraction errors in a downloadable diagnostic report', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await openDebugSource({
      id: 'subject:broken',
      label: '损坏的条目来源',
      collect: async () => {
        throw new TypeError('页面结构已变化');
      },
    });

    const report = JSON.parse(
      debugDialog().querySelector<HTMLTextAreaElement>('.e-bnwh-debug-json')!
        .value
    );
    expect(report).toMatchObject({
      format: 'bnwh-diagnostics/1',
      source: { id: 'subject:broken', label: '损坏的条目来源' },
      error: { name: 'TypeError', message: '页面结构已变化' },
    });
    expect(debugDialog().querySelector('.e-bnwh-debug-findings')?.getAttribute('data-level'))
      .toBe('error');
  });
});

describe('inspectExportPayload', () => {
  test('reports missing primary fields, empty values and exact duplicates', () => {
    const payload = buildExportPayload({
      kind: 'subject',
      site: 'dmm',
      sourceUrl: 'https://example.com',
      data: {
        type: 4,
        infos: [
          { name: '别名', value: '', category: 'alias' },
          { name: '平台', value: 'PC', category: 'listItem' },
          { name: '平台', value: 'PC', category: 'listItem' },
        ],
      },
    });

    expect(inspectExportPayload(payload).map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'missing-primary-field',
        'empty-field',
        'duplicate-field',
      ])
    );
  });
});
