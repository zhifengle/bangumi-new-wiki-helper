import { UI_FONT_STACK } from '../css/fontStacks';
import type { LogMsg } from '../interface/types';

let stack: HTMLDivElement | undefined;
const active = new Set<{ type: LogMsg['type']; dismiss(): void }>();

async function getStack() {
  if (!document.body && document.readyState === 'loading') {
    await new Promise((resolve) =>
      document.addEventListener('DOMContentLoaded', resolve, { once: true })
    );
  }
  if (!document.body) return;
  if (stack?.isConnected) return stack;

  const host = document.createElement('div');
  const root = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = `
    :host {
      position: fixed; inset: 16px 16px auto auto; z-index: 2147483647;
      width: min(360px, calc(100vw - 32px)); pointer-events: none;
    }
    .stack {
      display: grid;
      gap: 8px;
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      font: 14px/1.55 ${UI_FONT_STACK};
    }
    .toast {
      display: flex; gap: 8px; align-items: start; justify-content: space-between;
      padding: 10px 12px; pointer-events: auto; background: #fff; color: #18181b;
      border: 1px solid #d4d4d8; border-inline-start: 4px solid #a83a61;
      border-radius: 6px; overflow-wrap: anywhere;
    }
    .toast[data-type="error"] { border-inline-start-color: #b91c1c; }
    .toast[data-type="succuss"] { border-inline-start-color: #15803d; }
    .message { min-width: 0; white-space: pre-line; }
    a { display: block; margin-top: 4px; color: #1d4ed8; }
    button { border: 0; padding: 0 4px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
  `;
  stack = document.createElement('div');
  stack.className = 'stack';
  stack.lang = 'zh-Hans';
  root.append(style, stack);
  document.body.appendChild(host);
  return stack;
}

export async function logMessage(request: LogMsg) {
  if (request.cmd) {
    for (const toast of active) {
      if (request.cmd === 'dismissAll' || toast.type !== 'error') toast.dismiss();
    }
  }
  if (!request.message) return;
  const container = await getStack();
  if (!container) return;

  const tile = document.createElement('div');
  tile.className = 'toast';
  tile.dataset.type = request.type;
  const region = document.createElement('div');
  region.className = 'message';
  region.setAttribute('role', request.type === 'error' ? 'alert' : 'status');
  tile.append(region);
  container.append(tile);
  region.textContent = request.message;
  if (request.link && /^https?:\/\//i.test(request.link)) {
    const link = document.createElement('a');
    link.href = request.link;
    link.textContent = request.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    region.append(link);
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const toast = {
    type: request.type,
    dismiss() {
      clearTimeout(timer);
      tile.remove();
      active.delete(toast);
    },
  };
  active.add(toast);
  const duration = request.duration ?? (request.type === 'error' ? 0 : 3000);
  if (duration > 0) {
    timer = setTimeout(toast.dismiss, duration);
  } else {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '×';
    button.setAttribute('aria-label', '关闭提示');
    button.addEventListener('click', toast.dismiss);
    tile.append(button);
  }
}
