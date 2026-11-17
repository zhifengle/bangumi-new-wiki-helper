import {
  getCoverValue,
  getStringValue,
  PersonWikiInfo,
  SingleInfo,
  SubjectWikiInfo,
} from '../interface/subjectInfo';
import type { PersonSourceDefinition } from '../interface/wiki';
import { createSelectorCheck, resolveSelectorMatch } from '../sites/core/selector';
import type { ReportSelectorCheck, SelectorCheck } from '../sites/core/selector';
import { downloadFile, htmlToElement } from '../utils/domUtils';
import { APP_VERSION } from '../version';
import { debugDialogStyle } from './debugDialogStyle';

export const EXPORT_FORMAT = 'bnwh-export/1';
export const DEBUG_FAILURE_FORMAT = 'bnwh-diagnostics/1';

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

export type DiagnosticIssue = {
  severity: 'error' | 'warning';
  code: 'no-fields' | 'missing-primary-field' | 'empty-field' | 'duplicate-field' | 'empty-cover';
  message: string;
  fieldIndex?: number;
};

export type DebugSource = {
  id: string;
  label: string;
  collect: (report: ReportSelectorCheck) => Promise<ExportPayload>;
  menuFallback?: 'url-match' | 'host-match';
};

type DebugFailureReport = {
  format: typeof DEBUG_FAILURE_FORMAT;
  helperVersion: string;
  source: { id: string; label: string };
  sourceUrl: string;
  capturedAt: string;
  error: { name: string; message: string; stack?: string };
};

type DiagnosticView = {
  context: string;
  site: string;
  sourceUrl: string;
  capturedAt: string;
  infos: SingleInfo[];
  issues: DiagnosticIssue[];
  raw: ExportPayload | DebugFailureReport;
  fileName: string;
  sourceId?: string;
  selectorChecks: SelectorCheck[];
};

const KIND_LABELS: Record<ExportKind, string> = {
  subject: '条目',
  character: '角色',
  person: '人物',
};

const COPY_REPORT_LABEL = '复制排查报告';
const COPY_JSON_LABEL = '复制 JSON';
const COPIED_LABEL = '已复制';
const DEBUG_HOST_CLASS = 'e-bnwh-debug-host';
const debugSources = new Map<string, DebugSource>();
let currentView: DiagnosticView | undefined;

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

function isEmptyValue(value: SingleInfo['value']): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

export function inspectExportPayload(payload: ExportPayload): DiagnosticIssue[] {
  const { infos } = payload.data;
  const issues: DiagnosticIssue[] = [];
  if (!infos.length) {
    issues.push({
      severity: 'error',
      code: 'no-fields',
      message: '没有提取到任何字段，请检查页面结构或来源配置。',
    });
    return issues;
  }

  const primaryCategory = payload.kind === 'subject' ? 'subject_title' : 'crt_name';
  const primaryLabel = payload.kind === 'subject' ? '主标题' : '姓名';
  const hasPrimary = infos.some(
    (info) => info.category === primaryCategory && !isEmptyValue(info.value)
  );
  if (!hasPrimary) {
    issues.push({
      severity: 'error',
      code: 'missing-primary-field',
      message: `缺少有效的${primaryLabel}字段（${primaryCategory}）。`,
    });
  }

  const seen = new Map<string, number>();
  infos.forEach((info, fieldIndex) => {
    const isCover = info.category === 'cover' || info.category === 'crt_cover';
    if (isEmptyValue(info.value) && !isCover) {
      issues.push({
        severity: 'warning',
        code: 'empty-field',
        fieldIndex,
        message: `字段“${info.name}”没有值。`,
      });
    }
    if (
      isCover &&
      !getCoverValue(info.value)?.url &&
      !getCoverValue(info.value)?.dataUrl &&
      !getStringValue(info.value).trim()
    ) {
      issues.push({
        severity: 'warning',
        code: 'empty-cover',
        fieldIndex,
        message: `封面字段“${info.name}”不包含可用的图片地址或数据。`,
      });
    }
    const key = `${info.name}\u0000${info.category ?? ''}\u0000${JSON.stringify(info.value)}`;
    const previousIndex = seen.get(key);
    if (previousIndex !== undefined) {
      issues.push({
        severity: 'warning',
        code: 'duplicate-field',
        fieldIndex,
        message: `字段“${info.name}”与第 ${previousIndex + 1} 项完全重复。`,
      });
    } else {
      seen.set(key, fieldIndex);
    }
  });
  return issues;
}

export function registerDebugSource(source: DebugSource) {
  debugSources.set(source.id, source);
  return () => {
    if (debugSources.get(source.id) === source) debugSources.delete(source.id);
  };
}

export function clearDebugSources() {
  debugSources.clear();
}

export function registerPageDebugFallback(
  source: DebugSource,
  model: Pick<PersonSourceDefinition, 'pageSelectors' | 'controlSelector' | 'urlRules'>
) {
  const matchesUrl = model.urlRules?.some((rule) => rule.test(location.href));
  registerDebugSource({
    ...source,
    menuFallback: matchesUrl ? 'url-match' : 'host-match',
    collect: async (report) => {
      const anchors = [
        ['页面识别', model.pageSelectors],
        ['按钮挂载位置', model.controlSelector],
      ] as const;
      for (const [name, selector] of anchors) {
        const check = createSelectorCheck(name);
        try {
          if (resolveSelectorMatch(selector, undefined, check.attempts)) {
            check.result = 'matched';
          }
        } catch (error) {
          check.result = 'error';
          check.error = String(error).slice(0, 300);
        }
        report(check);
        if (check.result !== 'matched') {
          throw new Error(`${name}未通过，请查看选择器诊断。`);
        }
      }
      throw new Error('页面和挂载位置均已命中，但此来源的页面按钮尚未初始化。');
    },
  });
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { name: 'Error', message: String(error) };
}

function buildFailureReport(source: DebugSource, error: unknown): DebugFailureReport {
  return {
    format: DEBUG_FAILURE_FORMAT,
    helperVersion: APP_VERSION,
    source: { id: source.id, label: source.label },
    sourceUrl: location.href,
    capturedAt: new Date().toISOString(),
    error: serializeError(error),
  };
}

export async function openDebugSource(source: DebugSource) {
  const selectorChecks: SelectorCheck[] = [];
  try {
    const payload = await source.collect((check) => selectorChecks.push(check));
    showExportDialog(payload, source.id, selectorChecks);
  } catch (error) {
    console.error('bnwh diagnostic collection failed:', error);
    showFailureDialog(buildFailureReport(source, error), source.id, selectorChecks);
  }
}

export async function showCurrentPageDebugTool() {
  const sources = [...debugSources.values()];
  const source =
    sources.find((entry) => !entry.menuFallback) ??
    sources.find((entry) => entry.menuFallback === 'url-match') ??
    sources[0];
  if (!source) {
    window.alert('当前页面没有可调试的数据来源。请打开受支持的来源详情页后重试。');
    return;
  }
  await openDebugSource(source);
}

function getDebugDialog() {
  const host = document.querySelector<HTMLElement>(`.${DEBUG_HOST_CLASS}`);
  const dialog = host?.shadowRoot?.querySelector<HTMLDialogElement>(
    '.e-bnwh-debug-dialog'
  );
  return host && dialog ? { host, dialog } : undefined;
}

function openDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal();
    return;
  }
  dialog.setAttribute('open', '');
}

function closeDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function summarizeDataUrl(value: string) {
  if (!/^data:[^,\s]*,/i.test(value)) return value;
  return `[Data URL · ${formatBytes(new Blob([value]).size)} · 已省略]`;
}

function formatValue(value: SingleInfo['value']) {
  if (typeof value === 'string') return summarizeDataUrl(value) || '（空）';
  const cover = getCoverValue(value);
  if (cover) {
    const urls = new Set(
      [cover.url, cover.dataUrl].filter(
        (url): url is string => typeof url === 'string' && url.length > 0
      )
    );
    return [...urls].map(summarizeDataUrl).join(' · ') || '（空）';
  }
  if (value === undefined) return '（undefined）';
  return JSON.stringify(value) ?? String(value);
}

function selectorCheckStatus(check: SelectorCheck) {
  switch (check.result) {
    case 'matched':
      return check.attempts.length > 1 ? '后备规则命中' : '命中';
    case 'missed':
      return '未命中';
    case 'empty':
      return '命中但未提取到值';
    case 'error':
      return check.attempts.some((attempt) => attempt.result === 'error')
        ? '选择器报错'
        : '取值报错';
  }
}

function selectorAttemptLines(check: SelectorCheck) {
  const labels = { matched: '命中', missed: '未命中', error: '报错' };
  const lines = check.attempts.map(
    ({ rule, result, node }, index) =>
      `${index + 1}. ${labels[result]} ${rule}${node ? ` → ${node}` : ''}`
  );
  if (check.error) lines.push(check.error);
  return lines;
}

function buildDiagnosticReport(view: DiagnosticView) {
  const errors = view.issues.filter((issue) => issue.severity === 'error').length;
  const warnings = view.issues.length - errors;
  const issueLines = view.issues.length
    ? view.issues.map((issue) => `- [${issue.severity === 'error' ? '错误' : '提醒'}] ${issue.message}`)
    : ['- 未发现明显的数据结构问题。'];
  return [
    '# Bangumi New Wiki Helper 排查报告',
    '',
    `- 助手版本：${APP_VERSION}`,
    `- 数据来源：${view.context}`,
    `- 页面地址：${view.sourceUrl}`,
    `- 捕获时间：${view.capturedAt}`,
    `- 字段数量：${view.infos.length}`,
    `- 检查结果：${errors} 个错误，${warnings} 个提醒`,
    '',
    '## 检查结果',
    '',
    ...issueLines,
    ...(view.selectorChecks.length ? [
      '',
      '## 选择器诊断',
      '',
      ...view.selectorChecks.flatMap((check) => [
        `- ${check.name}（${check.scope}）：${selectorCheckStatus(check)}`,
        ...selectorAttemptLines(check).map((line) => `  ${line}`),
      ]),
    ] : []),
    '',
    '## 提取数据',
    '',
    '```json',
    JSON.stringify(view.raw, (_key, value) =>
      typeof value === 'string' ? summarizeDataUrl(value) : value, 2
    ),
    '```',
  ].join('\n');
}

function createDebugDialog() {
  const host = document.createElement('div');
  host.className = DEBUG_HOST_CLASS;
  const shadow = host.attachShadow({ mode: 'open' });
  const dialog = htmlToElement<HTMLDialogElement>(`
<dialog class="e-bnwh-debug-dialog" lang="zh-Hans" aria-labelledby="e-bnwh-debug-title">
  <style>${debugDialogStyle}</style>
  <div class="e-bnwh-debug-shell">
    <header class="e-bnwh-debug-header">
      <div class="e-bnwh-debug-heading">
        <h2 class="e-bnwh-debug-title" id="e-bnwh-debug-title" tabindex="-1" autofocus>数据调试工具</h2>
        <p class="e-bnwh-debug-context"></p>
      </div>
      <button type="button" class="e-bnwh-debug-close-icon" aria-label="关闭">×</button>
    </header>
    <section class="e-bnwh-debug-findings" aria-label="检查概况">
      <p class="e-bnwh-debug-findings-title" role="status"></p>
      <dl class="e-bnwh-debug-summary">
        <div><dt>来源</dt><dd class="e-bnwh-debug-site"></dd></div>
        <div><dt>字段</dt><dd class="e-bnwh-debug-field-count"></dd></div>
        <div><dt>JSON</dt><dd class="e-bnwh-debug-size"></dd></div>
        <div><dt>版本</dt><dd>${APP_VERSION}</dd></div>
      </dl>
      <ul class="e-bnwh-debug-issues"></ul>
    </section>
    <div class="e-bnwh-debug-toolbar">
      <div class="e-bnwh-debug-tabs" role="tablist" aria-label="调试视图">
        <button type="button" class="e-bnwh-debug-tab" data-panel="fields" role="tab" aria-selected="true" id="e-bnwh-tab-fields" aria-controls="e-bnwh-panel-fields">字段检查</button>
        <button type="button" class="e-bnwh-debug-tab" data-panel="selectors" role="tab" aria-selected="false" id="e-bnwh-tab-selectors" aria-controls="e-bnwh-panel-selectors">选择器诊断</button>
        <button type="button" class="e-bnwh-debug-tab" data-panel="json" role="tab" aria-selected="false" id="e-bnwh-tab-json" aria-controls="e-bnwh-panel-json">原始 JSON</button>
      </div>
      <div class="e-bnwh-debug-source-wrap"><select class="e-bnwh-debug-source" aria-label="切换调试数据来源"></select></div>
    </div>
    <section class="e-bnwh-debug-panel" data-panel="fields" role="tabpanel" id="e-bnwh-panel-fields" aria-labelledby="e-bnwh-tab-fields">
      <div class="e-bnwh-debug-filter">
        <input class="e-bnwh-debug-search" type="search" placeholder="搜索字段名、分类或内容" aria-label="搜索字段">
        <output class="e-bnwh-debug-results" aria-label="匹配字段数量" hidden></output>
      </div>
      <div class="e-bnwh-debug-table-scroll" tabindex="0" role="region" aria-label="提取字段">
        <table class="e-bnwh-debug-table">
          <thead><tr><th scope="col">#</th><th scope="col">字段</th><th scope="col">分类</th><th scope="col">提取值</th></tr></thead>
          <tbody></tbody>
        </table>
        <p class="e-bnwh-debug-empty" hidden></p>
      </div>
    </section>
    <section class="e-bnwh-debug-panel" data-panel="selectors" role="tabpanel" id="e-bnwh-panel-selectors" aria-labelledby="e-bnwh-tab-selectors" tabindex="0" hidden>
      <p class="e-bnwh-debug-selector-note">显示本次检查实际尝试的候选规则。可选字段未命中可能是页面没有对应内容。站点后处理后的值请看「字段检查」。</p>
      <div class="e-bnwh-debug-selector-list"></div>
    </section>
    <section class="e-bnwh-debug-panel" data-panel="json" role="tabpanel" id="e-bnwh-panel-json" aria-labelledby="e-bnwh-tab-json" hidden>
      <textarea class="e-bnwh-debug-json" aria-label="原始 JSON 内容" readonly spellcheck="false" wrap="off"></textarea>
    </section>
    <footer class="e-bnwh-debug-footer">
      <p class="e-bnwh-debug-privacy">排查报告省略内嵌图片数据。</p>
      <button type="button" class="e-bnwh-debug-button e-bnwh-debug-button-primary e-bnwh-debug-copy-report">${COPY_REPORT_LABEL}</button>
      <button type="button" class="e-bnwh-debug-button e-bnwh-debug-copy-json">${COPY_JSON_LABEL}</button>
      <button type="button" class="e-bnwh-debug-button e-bnwh-debug-download">下载 JSON</button>
    </footer>
  </div>
</dialog>`);

  const query = <T extends Element>(selector: string) => dialog.querySelector<T>(selector)!;
  const setCopied = (button: HTMLButtonElement, defaultLabel: string) => {
    button.textContent = COPIED_LABEL;
    setTimeout(() => { button.textContent = defaultLabel; }, 1500);
  };
  const copyReport = query<HTMLButtonElement>('.e-bnwh-debug-copy-report');
  const copyJson = query<HTMLButtonElement>('.e-bnwh-debug-copy-json');
  copyReport.addEventListener('click', async () => {
    if (!currentView) return;
    try { await copyText(buildDiagnosticReport(currentView)); setCopied(copyReport, COPY_REPORT_LABEL); }
    catch (error) { console.error('bnwh diagnostic report copy failed:', error); }
  });
  copyJson.addEventListener('click', async () => {
    if (!currentView) return;
    try { await copyText(JSON.stringify(currentView.raw, null, 2)); setCopied(copyJson, COPY_JSON_LABEL); }
    catch (error) { console.error('bnwh diagnostic JSON copy failed:', error); }
  });
  query<HTMLButtonElement>('.e-bnwh-debug-download').addEventListener('click', () => {
    if (!currentView) return;
    downloadFile(JSON.stringify(currentView.raw, null, 2), currentView.fileName, 'application/json');
  });
  query<HTMLButtonElement>('.e-bnwh-debug-close-icon').addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(dialog); });
  const tabs = Array.from(dialog.querySelectorAll<HTMLButtonElement>('.e-bnwh-debug-tab'));
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectDebugPanel(dialog, tab.dataset.panel));
    tab.addEventListener('keydown', (event) => {
      let nextIndex: number;
      switch (event.key) {
        case 'ArrowLeft': nextIndex = (index + tabs.length - 1) % tabs.length; break;
        case 'ArrowRight': nextIndex = (index + 1) % tabs.length; break;
        case 'Home': nextIndex = 0; break;
        case 'End': nextIndex = tabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      const next = tabs[nextIndex];
      selectDebugPanel(dialog, next.dataset.panel);
      next.focus();
    });
  });
  query<HTMLSelectElement>('.e-bnwh-debug-source').addEventListener('change', (event) => {
    const source = debugSources.get((event.currentTarget as HTMLSelectElement).value);
    if (source) void openDebugSource(source);
  });
  query<HTMLInputElement>('.e-bnwh-debug-search').addEventListener('input', () => renderFields(dialog));
  shadow.appendChild(dialog);
  document.body.appendChild(host);
  return { host, dialog };
}

function selectDebugPanel(dialog: HTMLDialogElement, panel?: string) {
  dialog.querySelectorAll<HTMLElement>('[data-panel]').forEach((element) => {
    const selected = element.dataset.panel === panel;
    if (element.classList.contains('e-bnwh-debug-tab')) {
      element.setAttribute('aria-selected', String(selected));
      element.tabIndex = selected ? 0 : -1;
    } else {
      element.hidden = !selected;
    }
  });
}

function renderSelectorChecks(dialog: HTMLDialogElement, checks: SelectorCheck[]) {
  const list = dialog.querySelector('.e-bnwh-debug-selector-list')!;
  list.replaceChildren();
  if (!checks.length) {
    const empty = document.createElement('p');
    empty.className = 'e-bnwh-debug-empty';
    empty.textContent = '本次没有记录到配置选择器的执行。';
    list.append(empty);
    return;
  }
  for (const check of checks) {
    const details = document.createElement('details');
    details.dataset.result = check.result;
    const summary = document.createElement('summary');
    const status = document.createElement('span');
    status.className = 'e-bnwh-debug-selector-status';
    status.textContent = selectorCheckStatus(check);
    summary.append(check.name, ' · ', status, ` · ${check.scope}`);
    const attempts = document.createElement('pre');
    attempts.textContent = selectorAttemptLines(check).join('\n');
    details.append(summary, attempts);
    list.append(details);
  }
}

function renderFields(dialog: HTMLDialogElement) {
  if (!currentView) return;
  const sourceLanguage = document.documentElement.lang;
  const query = dialog.querySelector<HTMLInputElement>('.e-bnwh-debug-search')!.value.trim().toLocaleLowerCase();
  const tbody = dialog.querySelector<HTMLTableSectionElement>('tbody')!;
  const problemIndexes = new Set(currentView.issues.map((issue) => issue.fieldIndex).filter((index): index is number => index !== undefined));
  tbody.replaceChildren();
  currentView.infos.forEach((info, index) => {
    const value = formatValue(info.value);
    if (query && !`${info.name} ${info.category ?? ''} ${value}`.toLocaleLowerCase().includes(query)) return;
    const row = document.createElement('tr');
    if (problemIndexes.has(index)) row.className = 'is-problem';
    [String(index + 1), info.name, info.category || '—', value].forEach((text, column) => {
      const cell = row.insertCell();
      cell.textContent = text;
      if (column === 3 && sourceLanguage) cell.lang = sourceLanguage;
      if (column === 1 && info.category) {
        const category = document.createElement('small');
        category.className = 'e-bnwh-debug-mobile-category';
        category.textContent = info.category;
        cell.append(category);
      }
    });
    tbody.appendChild(row);
  });
  const matches = tbody.rows.length;
  const count = dialog.querySelector<HTMLOutputElement>('.e-bnwh-debug-results')!;
  count.textContent = `${matches} / ${currentView.infos.length} 项`;
  count.hidden = !query;
  const empty = dialog.querySelector<HTMLElement>('[data-panel="fields"] .e-bnwh-debug-empty')!;
  empty.textContent = query ? '没有匹配的字段。' : '本次没有提取到字段。';
  empty.hidden = matches > 0;
  tbody.closest('.e-bnwh-debug-table-scroll')!.scrollTop = 0;
}

function renderSourceSelect(dialog: HTMLDialogElement) {
  const wrap = dialog.querySelector<HTMLElement>('.e-bnwh-debug-source-wrap')!;
  const select = dialog.querySelector<HTMLSelectElement>('.e-bnwh-debug-source')!;
  select.replaceChildren();
  debugSources.forEach((source) => {
    const option = document.createElement('option');
    option.value = source.id;
    option.textContent = source.label;
    option.selected = source.id === currentView?.sourceId;
    select.appendChild(option);
  });
  wrap.hidden = debugSources.size < 2;
}

function showDiagnosticView(view: DiagnosticView) {
  currentView = view;
  const { dialog } = getDebugDialog() ?? createDebugDialog();
  const rawJson = JSON.stringify(view.raw, null, 2);
  const errors = view.issues.filter((issue) => issue.severity === 'error').length;
  const warnings = view.issues.length - errors;
  dialog.querySelector<HTMLElement>('.e-bnwh-debug-title')!.textContent = `数据调试工具 · ${view.context}`;
  const context = dialog.querySelector<HTMLElement>('.e-bnwh-debug-context')!;
  context.textContent = context.title = view.sourceUrl;
  dialog.querySelector<HTMLElement>('.e-bnwh-debug-site')!.textContent = view.site;
  dialog.querySelector<HTMLElement>('.e-bnwh-debug-field-count')!.textContent = `${view.infos.length} 项`;
  dialog.querySelector<HTMLElement>('.e-bnwh-debug-size')!.textContent = formatBytes(new Blob([rawJson]).size);
  dialog.querySelector<HTMLTextAreaElement>('.e-bnwh-debug-json')!.value = rawJson;
  dialog.querySelector<HTMLInputElement>('.e-bnwh-debug-search')!.value = '';
  const findings = dialog.querySelector<HTMLElement>('.e-bnwh-debug-findings')!;
  findings.dataset.level = errors ? 'error' : warnings ? 'warning' : 'ok';
  findings.querySelector<HTMLElement>('.e-bnwh-debug-findings-title')!.textContent = errors
    ? `发现 ${errors} 个错误、${warnings} 个提醒`
    : warnings ? `发现 ${warnings} 个需要确认的提醒` : '未发现明显的数据结构问题';
  const issueList = findings.querySelector<HTMLUListElement>('.e-bnwh-debug-issues')!;
  issueList.replaceChildren();
  issueList.hidden = !view.issues.length;
  view.issues.forEach((issue) => {
    const item = document.createElement('li');
    item.textContent = issue.message;
    issueList.appendChild(item);
  });
  renderSourceSelect(dialog);
  renderFields(dialog);
  renderSelectorChecks(dialog, view.selectorChecks);
  const panel = view.raw.format === DEBUG_FAILURE_FORMAT && view.selectorChecks.length
    ? 'selectors'
    : 'fields';
  selectDebugPanel(dialog, panel);
  dialog.querySelector<HTMLButtonElement>('.e-bnwh-debug-copy-report')!.textContent = COPY_REPORT_LABEL;
  dialog.querySelector<HTMLButtonElement>('.e-bnwh-debug-copy-json')!.textContent = COPY_JSON_LABEL;
  openDialog(dialog);
}

export function showExportDialog(
  payload: ExportPayload,
  sourceId?: string,
  selectorChecks: SelectorCheck[] = []
) {
  showDiagnosticView({
    context: KIND_LABELS[payload.kind],
    site: payload.site,
    sourceUrl: payload.sourceUrl,
    capturedAt: payload.exportedAt,
    infos: payload.data.infos,
    issues: inspectExportPayload(payload),
    raw: payload,
    fileName: getExportFileName(payload),
    sourceId,
    selectorChecks,
  });
}

function showFailureDialog(
  report: DebugFailureReport,
  sourceId: string,
  selectorChecks: SelectorCheck[]
) {
  const stamp = report.capturedAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  showDiagnosticView({
    context: '提取失败',
    site: report.source.label,
    sourceUrl: report.sourceUrl,
    capturedAt: report.capturedAt,
    infos: [],
    issues: [{ severity: 'error', code: 'no-fields', message: `${report.error.name}: ${report.error.message}` }],
    raw: report,
    fileName: `bnwh-diagnostics-error-${stamp}.json`,
    sourceId,
    selectorChecks,
  });
}
