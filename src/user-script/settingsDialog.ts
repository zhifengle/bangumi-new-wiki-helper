import { UI_FONT_STACK } from '../css/fontStacks';
import { htmlToElement } from '../utils/domUtils';
import { setExportButtonsVisible } from '../sites/core/controls';
import {
  BangumiAccessTokenError,
  verifyBangumiAccessToken,
} from '../sites/bangumi/authenticatedSearch';
import {
  BGM_ACCESS_TOKEN,
  BGM_DOMAIN,
  PROTOCOL,
  FALLBACK_TO_WEB_SEARCH,
  SHOW_EXPORT_BUTTONS,
} from './constants';

const BANGUMI_DOMAINS = ['bgm.tv', 'bangumi.tv', 'chii.in'] as const;
const TOKEN_SETTINGS_HASH = '#bnwh-token-settings';
const TOKEN_ISSUE_URL = 'https://next.bgm.tv/demo/access-token';
const SETTINGS_HOST_CLASS = 'e-bnwh-config-host';

function getSettingsDialog() {
  return document
    .querySelector<HTMLElement>(`.${SETTINGS_HOST_CLASS}`)
    ?.shadowRoot?.querySelector<HTMLDialogElement>('.e-bnwh-config-dialog');
}

function canEditToken() {
  const { protocol, hostname } = window.location;
  return window.top === window && protocol === 'https:' &&
    BANGUMI_DOMAINS.some((domain) => domain === hostname);
}

export function openLinkedTokenSettings() {
  const { hash, pathname, search } = window.location;
  if (hash !== TOKEN_SETTINGS_HASH || !canEditToken()) return;
  window.history.replaceState(window.history.state, '', pathname + search);
  showSettingsDialog(true);
}

export function showSettingsDialog(focusToken = false) {
  const existing = getSettingsDialog();
  if (existing) {
    if (!existing.open) existing.showModal();
    if (focusToken) existing.querySelector<HTMLInputElement>('#e-bnwh-token')?.focus();
    return;
  }

  const currentDomain = GM_getValue<string>(BGM_DOMAIN) || 'bgm.tv';
  const useHttps = (GM_getValue<string>(PROTOCOL) || 'https') === 'https';
  const fallbackToWebSearch =
    GM_getValue<boolean>(FALLBACK_TO_WEB_SEARCH) || false;
  const showExportButtons = GM_getValue<boolean>(SHOW_EXPORT_BUTTONS) === true;
  const hasAccessToken = Boolean(GM_getValue<string>(BGM_ACCESS_TOKEN));
  const editTokenHere = canEditToken();
  const tokenSettingsHost = BANGUMI_DOMAINS.find((domain) => domain === currentDomain) ?? 'bgm.tv';
  const domainOptions = BANGUMI_DOMAINS.map(
    (domain) =>
      `<option value="${domain}"${domain === currentDomain ? ' selected' : ''}>${domain}</option>`
  ).join('');

  const $host = document.createElement('div');
  $host.className = SETTINGS_HOST_CLASS;
  const $shadow = $host.attachShadow({ mode: 'open' });
  const $dialog = htmlToElement<HTMLDialogElement>(`
<dialog class="e-bnwh-config-dialog" lang="zh-Hans" aria-labelledby="e-bnwh-config-title">
  <style>
    :host {
      all: initial !important;
      display: contents !important;
    }
    .e-bnwh-config-dialog {
      box-sizing: border-box;
      width: min(460px, calc(100vw - 32px));
      max-height: calc(100vh - 32px);
      margin: auto;
      padding: 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #09090b;
      background: #fff;
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
      font: 14px/1.55 ${UI_FONT_STACK};
      color-scheme: light;
    }
    .e-bnwh-config-dialog::backdrop {
      background: rgba(15, 23, 42, 0.42);
    }
    .e-bnwh-config-content {
      box-sizing: border-box;
      padding: 20px;
    }
    .e-bnwh-config-header {
      margin-bottom: 14px;
    }
    .e-bnwh-config-title {
      margin: 0;
      color: #09090b;
      font-size: 18px;
      font-weight: 700;
      line-height: 1.4;
    }
    .e-bnwh-config-row-desc,
    .e-bnwh-config-status {
      color: #71717a;
      font-size: 12px;
      line-height: 1.45;
    }
    .e-bnwh-config-section {
      display: grid;
      gap: 8px;
      padding: 14px 0;
      border-top: 1px solid #e5e7eb;
    }
    .e-bnwh-config-row {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-height: 44px;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .e-bnwh-config-row:hover {
      border-color: #d4d4d8;
      background: #f8fafc;
    }
    .e-bnwh-config-row-text {
      display: grid;
      gap: 3px;
      min-width: 0;
    }
    .e-bnwh-config-row-title {
      color: #09090b;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.35;
    }
    .e-bnwh-config-row-desc {
      margin: 0;
    }
    .e-bnwh-config-switch {
      appearance: none;
      position: relative;
      flex: 0 0 auto;
      width: 38px;
      height: 22px;
      margin: 0;
      border: 1px solid transparent;
      border-radius: 999px;
      background: #e4e4e7;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .e-bnwh-config-switch::after {
      content: "";
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      border-radius: 999px;
      background: #fff;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
      transition: transform 0.15s ease;
    }
    .e-bnwh-config-switch:checked {
      background: #18181b;
    }
    .e-bnwh-config-switch:checked::after {
      transform: translateX(16px);
    }
    .e-bnwh-config-select {
      box-sizing: border-box;
      min-width: 120px;
      height: 36px;
      padding: 0 10px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #09090b;
      background: #fff;
      font: inherit;
      font-size: 13px;
    }
    .e-bnwh-config-switch:focus-visible,
    .e-bnwh-config-select:focus-visible,
    .e-bnwh-config-input:focus-visible,
    .e-bnwh-config-button:focus-visible {
      outline: 2px solid #18181b;
      outline-offset: 2px;
    }
    .e-bnwh-config-status {
      margin: 0;
    }
    .e-bnwh-config-status[data-error] {
      color: #b91c1c;
    }
    .e-bnwh-config-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    .e-bnwh-config-button {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 36px;
      padding: 0 14px;
      border: 1px solid #18181b;
      border-radius: 8px;
      color: #fff;
      background: #18181b;
      font: inherit;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      white-space: nowrap;
    }
    .e-bnwh-config-button:hover {
      background: #27272a;
    }
    .e-bnwh-config-button:disabled {
      opacity: 0.55;
      cursor: default;
    }
    .e-bnwh-config-button[hidden] { display: none; }
    .e-bnwh-config-button-secondary {
      border-color: #d4d4d8;
      background: #fff;
      color: #18181b;
    }
    .e-bnwh-config-button-secondary:hover {
      background: #f4f4f5;
      color: #18181b;
    }
    .e-bnwh-config-token-header,
    .e-bnwh-config-token-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .e-bnwh-config-token-header { justify-content: space-between; }
    .e-bnwh-config-token-header h2 { margin: 0; }
    .e-bnwh-config-token-state { display: block; margin-top: 2px; }
    .e-bnwh-config-token-form { display: grid; gap: 8px; margin: 0; }
    .e-bnwh-config-input {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      min-height: 40px;
      padding: 8px 10px;
      border: 1px solid #d4d4d8;
      border-radius: 8px;
      background: #fff;
      color: #18181b;
      font: inherit;
    }
  </style>
  <div class="e-bnwh-config-content">
    <div class="e-bnwh-config-header">
      <p id="e-bnwh-config-title" class="e-bnwh-config-title">条目助手设置</p>
    </div>
    <div class="e-bnwh-config-section">
      <div class="e-bnwh-config-token-header">
        <div>
          <h2 id="e-bnwh-token-title" class="e-bnwh-config-row-title">Bangumi Access Token</h2>
          <span class="e-bnwh-config-row-desc e-bnwh-config-token-state">${hasAccessToken ? '已配置' : '未配置'}</span>
        </div>
        <a class="e-bnwh-config-button e-bnwh-config-button-secondary" href="${TOKEN_ISSUE_URL}" target="_blank" rel="noopener noreferrer">获取 Token ↗</a>
      </div>
      <p id="e-bnwh-token-help" class="e-bnwh-config-row-desc">${editTokenHere
        ? '粘贴令牌后验证保存。查重时可搜索账号有权查看的 R18 条目。'
        : '请在 Bangumi 页面粘贴并验证令牌。'
      }</p>
      ${editTokenHere ? `
      <form class="e-bnwh-config-token-form">
        <input id="e-bnwh-token" class="e-bnwh-config-input" type="password" autocomplete="off" spellcheck="false" placeholder="${hasAccessToken ? '粘贴新 Token 以替换' : '粘贴 Access Token'}" aria-labelledby="e-bnwh-token-title" aria-describedby="e-bnwh-token-help" required>
        <div class="e-bnwh-config-token-actions">
          <button class="e-bnwh-config-button" type="submit">验证并保存</button>
          <button class="e-bnwh-config-button e-bnwh-config-button-secondary e-bnwh-config-clear-token" type="button"${hasAccessToken ? '' : ' hidden'}>清除 Token</button>
        </div>
        <p class="e-bnwh-config-status e-bnwh-config-token-feedback" role="status"></p>
      </form>
      ` : `
      <div class="e-bnwh-config-token-actions">
        <a class="e-bnwh-config-button" href="https://${tokenSettingsHost}/${TOKEN_SETTINGS_HASH}" target="_blank" rel="noopener noreferrer">去 Bangumi 配置 ↗</a>
      </div>
      `}
    </div>
    <div class="e-bnwh-config-section">
      <label class="e-bnwh-config-row" for="e-bnwh-domain">
        <span class="e-bnwh-config-row-text">
          <span class="e-bnwh-config-row-title">Bangumi 域名</span>
          <span class="e-bnwh-config-row-desc">新建条目与查重请求使用的站点</span>
        </span>
        <select class="e-bnwh-config-select" id="e-bnwh-domain">${domainOptions}</select>
      </label>
      <label class="e-bnwh-config-row" for="e-bnwh-use-https">
        <span class="e-bnwh-config-row-text">
          <span class="e-bnwh-config-row-title">使用 HTTPS</span>
          <span class="e-bnwh-config-row-desc">关闭后使用 HTTP 访问所选域名</span>
        </span>
        <input class="e-bnwh-config-switch" type="checkbox" id="e-bnwh-use-https"${useHttps ? ' checked' : ''}>
      </label>
    </div>
    <div class="e-bnwh-config-section">
      <label class="e-bnwh-config-row" for="e-bnwh-web-search-fallback">
        <span class="e-bnwh-config-row-text">
          <span class="e-bnwh-config-row-title">启用网页搜索回退</span>
          <span class="e-bnwh-config-row-desc">默认关闭。Bangumi 接口未返回条目时，再请求站内搜索页查重。</span>
        </span>
        <input class="e-bnwh-config-switch" type="checkbox" id="e-bnwh-web-search-fallback"${fallbackToWebSearch ? ' checked' : ''}>
      </label>
      <label class="e-bnwh-config-row" for="e-bnwh-show-export">
        <span class="e-bnwh-config-row-text">
          <span class="e-bnwh-config-row-title">显示数据调试按钮</span>
          <span class="e-bnwh-config-row-desc">在来源页面显示条目、人物和角色的快捷调试入口</span>
        </span>
        <input class="e-bnwh-config-switch" type="checkbox" id="e-bnwh-show-export"${showExportButtons ? ' checked' : ''}>
      </label>
    </div>
    <div class="e-bnwh-config-footer">
      <p class="e-bnwh-config-status e-bnwh-config-general-status" role="status"></p>
      <button class="e-bnwh-config-button e-bnwh-config-close" type="button" autofocus>完成</button>
    </div>
  </div>
</dialog>
`);

  const $status = $dialog.querySelector<HTMLElement>(
    '.e-bnwh-config-general-status'
  )!;
  const setStatus = (message: string) => {
    $status.textContent = message;
  };

  const tokenInput = initTokenForm($dialog);

  $dialog
    .querySelector<HTMLSelectElement>('#e-bnwh-domain')!
    .addEventListener('change', (event) => {
      const value = (event.currentTarget as HTMLSelectElement).value;
      GM_setValue(BGM_DOMAIN, value);
      setStatus(`Bangumi 域名已保存为 ${value}。`);
    });
  $dialog
    .querySelector<HTMLInputElement>('#e-bnwh-use-https')!
    .addEventListener('change', (event) => {
      const checked = (event.currentTarget as HTMLInputElement).checked;
      GM_setValue(PROTOCOL, checked ? 'https' : 'http');
      setStatus(`HTTPS 已${checked ? '开启' : '关闭'}。`);
    });
  $dialog
    .querySelector<HTMLInputElement>('#e-bnwh-web-search-fallback')!
    .addEventListener('change', (event) => {
      const checked = (event.currentTarget as HTMLInputElement).checked;
      GM_setValue(FALLBACK_TO_WEB_SEARCH, checked);
      setStatus(`网页搜索回退已${checked ? '开启' : '关闭'}。`);
    });
  $dialog
    .querySelector<HTMLInputElement>('#e-bnwh-show-export')!
    .addEventListener('change', (event) => {
      const checked = (event.currentTarget as HTMLInputElement).checked;
      GM_setValue(SHOW_EXPORT_BUTTONS, checked);
      setExportButtonsVisible(checked);
      setStatus(`数据调试按钮已${checked ? '显示' : '隐藏'}。`);
    });

  const refreshTokenState = () => {
    $dialog.querySelector('.e-bnwh-config-token-state')!.textContent =
      GM_getValue<string>(BGM_ACCESS_TOKEN) ? '已配置' : '未配置';
  };
  if (!editTokenHere) window.addEventListener('focus', refreshTokenState);

  $dialog
    .querySelector<HTMLButtonElement>('.e-bnwh-config-close')!
    .addEventListener('click', () => $dialog.close());
  $dialog.addEventListener('close', () => {
    window.removeEventListener('focus', refreshTokenState);
    $host.remove();
  }, { once: true });
  $dialog.addEventListener('click', (event) => {
    if (event.target === $dialog) $dialog.close();
  });

  $shadow.appendChild($dialog);
  document.body.appendChild($host);
  $dialog.showModal();
  if (focusToken) tokenInput?.focus();
}

function initTokenForm(dialog: HTMLDialogElement) {
  const form = dialog.querySelector<HTMLFormElement>('.e-bnwh-config-token-form');
  if (!form) return;
  const input = form.querySelector<HTMLInputElement>('#e-bnwh-token')!;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const clear = form.querySelector<HTMLButtonElement>('.e-bnwh-config-clear-token')!;
  const feedback = form.querySelector<HTMLElement>('.e-bnwh-config-token-feedback')!;
  const state = dialog.querySelector<HTMLElement>('.e-bnwh-config-token-state')!;

  const setFeedback = (message: string, error = false) => {
    feedback.toggleAttribute('data-error', error);
    feedback.textContent = message;
  };
  const updateState = (configured: boolean) => {
    state.textContent = configured ? '已配置' : '未配置';
    input.value = '';
    input.placeholder = configured ? '粘贴新 Token 以替换' : '粘贴 Access Token';
    clear.hidden = !configured;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const token = input.value.trim();
    if (!token) {
      setFeedback('请先粘贴 Access Token。', true);
      input.focus();
      return;
    }

    input.readOnly = submit.disabled = clear.disabled = true;
    setFeedback('正在验证 Token…');
    try {
      await verifyBangumiAccessToken(token);
      if (!dialog.isConnected || !dialog.open) return;
      GM_setValue(BGM_ACCESS_TOKEN, token);
      updateState(true);
      setFeedback('验证通过，Token 已保存。');
    } catch (error) {
      setFeedback(
        error instanceof BangumiAccessTokenError
          ? 'Bangumi 拒绝了此 Token。请检查是否复制完整，或重新获取。'
          : '暂时无法验证 Token。请检查网络后重试。',
        true
      );
    } finally {
      input.readOnly = submit.disabled = clear.disabled = false;
    }
  });

  clear.addEventListener('click', () => {
    GM_deleteValue(BGM_ACCESS_TOKEN);
    updateState(false);
    setFeedback('Token 已清除。');
    input.focus();
  });

  return input;
}
