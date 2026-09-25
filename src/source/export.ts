import { PersonWikiInfo, SubjectWikiInfo } from '../interface/subjectInfo';
import { downloadFile, htmlToElement } from '../utils/domUtils';
import { APP_VERSION } from '../version';

export const EXPORT_FORMAT = 'bnwh-export/1';

export type ExportKind = 'subject' | 'character' | 'person';

export type ExportPayload = {
  format: typeof EXPORT_FORMAT;
  helperVersion: string;
  kind: ExportKind;
  site: string;
  sourceUrl: string;
  exportedAt: string;
  data: SubjectWikiInfo | PersonWikiInfo;
};

export type ExportInput = {
  kind: ExportKind;
  site: string;
  sourceUrl: string;
  data: SubjectWikiInfo | PersonWikiInfo;
  exportedAt?: Date;
};

const KIND_LABELS: Record<ExportKind, string> = {
  subject: '条目',
  character: '角色',
  person: '人物',
};

const COPY_LABEL = '复制';
const COPIED_LABEL = '已复制';

export function buildExportPayload(input: ExportInput): ExportPayload {
  return {
    format: EXPORT_FORMAT,
    helperVersion: APP_VERSION,
    kind: input.kind,
    site: input.site,
    sourceUrl: input.sourceUrl,
    exportedAt: (input.exportedAt ?? new Date()).toISOString(),
    data: input.data,
  };
}

export function serializeExportPayload(payload: ExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function getExportFileName(payload: ExportPayload): string {
  const stamp = payload.exportedAt
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
  return `bnwh-${payload.kind}-${payload.site}-${stamp}.json`;
}

function openDialog($dialog: HTMLDialogElement) {
  if (typeof $dialog.showModal === 'function') {
    if (!$dialog.open) $dialog.showModal();
    return;
  }
  $dialog.setAttribute('open', '');
}

function closeDialog($dialog: HTMLDialogElement) {
  if (typeof $dialog.close === 'function') {
    $dialog.close();
    return;
  }
  $dialog.removeAttribute('open');
}

async function copyText(text: string, $textarea: HTMLTextAreaElement) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  $textarea.focus();
  $textarea.select();
  document.execCommand('copy');
}

function createExportDialog(): HTMLDialogElement {
  const $dialog = htmlToElement<HTMLDialogElement>(`
<dialog class="e-bnwh-export-dialog" aria-labelledby="e-bnwh-export-title">
  <style>
    .e-bnwh-export-dialog {
      box-sizing: border-box;
      width: min(720px, calc(100vw - 32px));
      max-height: calc(100vh - 32px);
      padding: 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #09090b;
      background: #fff;
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .e-bnwh-export-dialog::backdrop {
      background: rgba(15, 23, 42, 0.42);
    }
    .e-bnwh-export-content {
      box-sizing: border-box;
      display: grid;
      gap: 12px;
      padding: 20px;
    }
    .e-bnwh-export-title {
      margin: 0;
      color: #09090b;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.4;
    }
    .e-bnwh-export-desc {
      margin: 0;
      color: #71717a;
      font-size: 12px;
      line-height: 1.45;
      word-break: break-all;
    }
    .e-bnwh-export-json {
      box-sizing: border-box;
      width: 100%;
      height: min(50vh, 420px);
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #09090b;
      background: #f8fafc;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      line-height: 1.5;
      resize: vertical;
    }
    .e-bnwh-export-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .e-bnwh-export-actions button {
      appearance: none;
      min-width: 72px;
      padding: 8px 14px;
      border: 1px solid #d4d4d8;
      border-radius: 8px;
      color: #09090b;
      background: #fff;
      font-size: 13px;
      cursor: pointer;
    }
    .e-bnwh-export-actions button:hover {
      background: #f4f4f5;
    }
    .e-bnwh-export-actions .e-bnwh-export-download {
      border-color: #16a34a;
      color: #fff;
      background: #16a34a;
    }
    .e-bnwh-export-actions .e-bnwh-export-download:hover {
      background: #15803d;
    }
  </style>
  <div class="e-bnwh-export-content">
    <h2 class="e-bnwh-export-title" id="e-bnwh-export-title"></h2>
    <p class="e-bnwh-export-desc"></p>
    <textarea class="e-bnwh-export-json" readonly spellcheck="false"></textarea>
    <div class="e-bnwh-export-actions">
      <button type="button" class="e-bnwh-export-copy">${COPY_LABEL}</button>
      <button type="button" class="e-bnwh-export-download">下载</button>
      <button type="button" class="e-bnwh-export-close">关闭</button>
    </div>
  </div>
</dialog>
  `);
  const $textarea = $dialog.querySelector<HTMLTextAreaElement>(
    '.e-bnwh-export-json'
  )!;
  const $copy = $dialog.querySelector<HTMLButtonElement>('.e-bnwh-export-copy')!;
  const $download = $dialog.querySelector<HTMLButtonElement>(
    '.e-bnwh-export-download'
  )!;
  const $close = $dialog.querySelector<HTMLButtonElement>('.e-bnwh-export-close')!;

  $copy.addEventListener('click', async () => {
    try {
      await copyText($textarea.value, $textarea);
      $copy.textContent = COPIED_LABEL;
      setTimeout(() => {
        $copy.textContent = COPY_LABEL;
      }, 1500);
    } catch (error) {
      console.error('bnwh export copy failed:', error);
    }
  });
  $download.addEventListener('click', () => {
    downloadFile(
      $textarea.value,
      $dialog.dataset.fileName || 'bnwh-export.json',
      'application/json'
    );
  });
  $close.addEventListener('click', () => {
    closeDialog($dialog);
  });
  document.body.appendChild($dialog);
  return $dialog;
}

export function showExportDialog(payload: ExportPayload) {
  const $dialog =
    document.querySelector<HTMLDialogElement>('dialog.e-bnwh-export-dialog') ??
    createExportDialog();
  $dialog.dataset.kind = payload.kind;
  $dialog.dataset.fileName = getExportFileName(payload);
  $dialog.querySelector<HTMLElement>('.e-bnwh-export-title')!.textContent =
    `导出 JSON · ${KIND_LABELS[payload.kind]}`;
  $dialog.querySelector<HTMLElement>('.e-bnwh-export-desc')!.textContent =
    `来源 ${payload.sourceUrl}`;
  const $textarea = $dialog.querySelector<HTMLTextAreaElement>(
    '.e-bnwh-export-json'
  )!;
  $textarea.value = serializeExportPayload(payload);
  $dialog.querySelector<HTMLButtonElement>('.e-bnwh-export-copy')!.textContent =
    COPY_LABEL;
  openDialog($dialog);
  $textarea.scrollTop = 0;
}
