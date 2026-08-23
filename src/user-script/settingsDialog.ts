import { htmlToElement } from '../utils/domUtils';
import {
  BGM_DOMAIN,
  PROTOCOL,
  FALLBACK_TO_WEB_SEARCH,
} from './constants';

const BANGUMI_DOMAINS = ['bgm.tv', 'bangumi.tv', 'chii.in'] as const;

export function showSettingsDialog() {
  const existing = document.querySelector<HTMLDialogElement>(
    '.e-bnwh-config-dialog'
  );
  if (existing) {
    if (!existing.open) existing.showModal();
    return;
  }

  const currentDomain = GM_getValue<string>(BGM_DOMAIN) || 'bgm.tv';
  const useHttps = (GM_getValue<string>(PROTOCOL) || 'https') === 'https';
  const fallbackToWebSearch =
    GM_getValue<boolean>(FALLBACK_TO_WEB_SEARCH) || false;
  const domainOptions = BANGUMI_DOMAINS.map(
    (domain) =>
      `<option value="${domain}"${domain === currentDomain ? ' selected' : ''}>${domain}</option>`
  ).join('');

  const $dialog = htmlToElement<HTMLDialogElement>(`
<dialog class="e-bnwh-config-dialog" aria-labelledby="e-bnwh-config-title">
  <style>
    .e-bnwh-config-dialog {
      box-sizing: border-box;
      width: min(420px, calc(100vw - 32px));
      max-height: calc(100vh - 32px);
      padding: 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #09090b;
      background: #fff;
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .e-bnwh-config-dialog::backdrop {
      background: rgba(15, 23, 42, 0.42);
    }
    .e-bnwh-config-content {
      box-sizing: border-box;
      padding: 20px;
    }
    .e-bnwh-config-header {
      margin-bottom: 18px;
    }
    .e-bnwh-config-title {
      margin: 0;
      color: #09090b;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.4;
    }
    .e-bnwh-config-desc,
    .e-bnwh-config-row-desc,
    .e-bnwh-config-status {
      color: #71717a;
      font-size: 12px;
      line-height: 1.45;
    }
    .e-bnwh-config-desc {
      margin: 6px 0 0;
      font-size: 13px;
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
      font-size: 13px;
    }
    .e-bnwh-config-switch:focus-visible,
    .e-bnwh-config-select:focus-visible,
    .e-bnwh-config-button:focus-visible {
      outline: 2px solid #18181b;
      outline-offset: 2px;
    }
    .e-bnwh-config-status {
      min-height: 18px;
      margin: 0;
      padding-top: 2px;
    }
    .e-bnwh-config-footer {
      display: flex;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    .e-bnwh-config-button {
      height: 36px;
      padding: 0 14px;
      border: 1px solid #18181b;
      border-radius: 8px;
      color: #fff;
      background: #18181b;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }
    .e-bnwh-config-button:hover {
      background: #27272a;
    }
  </style>
  <div class="e-bnwh-config-content">
    <div class="e-bnwh-config-header">
      <p id="e-bnwh-config-title" class="e-bnwh-config-title">条目助手设置</p>
      <p class="e-bnwh-config-desc">集中管理 Bangumi 地址和查重请求行为。</p>
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
      <p class="e-bnwh-config-status" aria-live="polite"></p>
    </div>
    <div class="e-bnwh-config-footer">
      <button class="e-bnwh-config-button e-bnwh-config-close" type="button" autofocus>完成</button>
    </div>
  </div>
</dialog>
`);

  const $status = $dialog.querySelector<HTMLElement>(
    '.e-bnwh-config-status'
  )!;
  const setStatus = (message: string) => {
    $status.textContent = message;
  };

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

  const closeDialog = () => {
    $dialog.close();
    $dialog.remove();
  };
  $dialog
    .querySelector<HTMLButtonElement>('.e-bnwh-config-close')!
    .addEventListener('click', closeDialog);
  $dialog.addEventListener('cancel', () => {
    $dialog.remove();
  });
  $dialog.addEventListener('click', (event) => {
    if (event.target === $dialog) closeDialog();
  });

  document.body.appendChild($dialog);
  $dialog.showModal();
}
