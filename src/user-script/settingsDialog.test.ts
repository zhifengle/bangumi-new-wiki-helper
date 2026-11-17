// @vitest-environment jsdom
import { vi } from 'vitest';
import { showSettingsDialog } from './settingsDialog';

const globalAny = globalThis as Record<string, unknown>;

describe('showSettingsDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <style>
        a, a:link, a:visited { color: blue !important; }
        form, div, h2, p { margin: 0; padding: 0; }
      </style>
    `;
    globalAny.GM_getValue = vi.fn();
    globalAny.GM_setValue = vi.fn();
    globalAny.GM_deleteValue = vi.fn();
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true;
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false;
        this.dispatchEvent(new Event('close'));
      },
    });
  });

  afterEach(() => {
    delete globalAny.GM_getValue;
    delete globalAny.GM_setValue;
    delete globalAny.GM_deleteValue;
  });

  test('isolates its controls from host-page selectors', () => {
    showSettingsDialog();

    const host = document.querySelector<HTMLElement>('.e-bnwh-config-host')!;
    const dialog = host.shadowRoot?.querySelector<HTMLDialogElement>(
      '.e-bnwh-config-dialog'
    );

    expect(dialog?.open).toBe(true);
    expect(dialog?.querySelector('.e-bnwh-config-button')).not.toBeNull();
    expect(document.querySelector('.e-bnwh-config-button')).toBeNull();
  });

  test('reuses the open dialog and removes its shadow host on close', () => {
    showSettingsDialog();
    showSettingsDialog();

    expect(document.querySelectorAll('.e-bnwh-config-host')).toHaveLength(1);
    const host = document.querySelector<HTMLElement>('.e-bnwh-config-host')!;
    const close = host.shadowRoot?.querySelector<HTMLButtonElement>(
      '.e-bnwh-config-close'
    );
    close?.click();

    expect(document.querySelector('.e-bnwh-config-host')).toBeNull();
  });
});
