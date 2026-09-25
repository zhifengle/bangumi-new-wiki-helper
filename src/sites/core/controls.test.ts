// @vitest-environment jsdom
import { vi } from 'vitest';
import {
  addCharaUI,
  appendExportBtn,
  insertControlBtn,
  insertControlBtnChara,
} from './controls';

async function flushAsyncEvents() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('core controls helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="anchor"></div>';
    vi.clearAllMocks();
  });

  test('insertControlBtn wires subject creation and duplicate-check buttons', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const anchor = document.querySelector('#anchor')!;

    insertControlBtn(anchor, handler);

    const buttons = document.querySelectorAll<HTMLElement>('.e-wiki-new-subject');
    buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();
    buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(handler).toHaveBeenNthCalledWith(1, expect.any(MouseEvent));
    expect(handler).toHaveBeenNthCalledWith(2, expect.any(MouseEvent), true);
    expect(buttons[1].innerHTML).toBe('新建并查重');
  });

  test('insertControlBtn keeps notmatched text when duplicate search fails', async () => {
    const handler = vi.fn().mockRejectedValue('notmatched');
    const anchor = document.querySelector('#anchor')!;

    insertControlBtn(anchor, handler);
    const duplicateButton = document.querySelectorAll<HTMLElement>(
      '.e-wiki-new-subject'
    )[1];

    duplicateButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(duplicateButton.innerHTML).toBe('未查到条目');
  });

  test('insertControlBtn accepts custom labels and keeps the duplicate-check guard working', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const anchor = document.querySelector('#anchor')!;

    insertControlBtn(anchor, handler, {
      create: '新建人物',
      createWithCheck: '新建人物并查重',
    });

    const buttons = document.querySelectorAll<HTMLElement>('.e-wiki-new-subject');
    expect(buttons[0].innerHTML).toBe('新建人物');
    expect(buttons[1].innerHTML).toBe('新建人物并查重');

    buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(handler).toHaveBeenCalledWith(expect.any(MouseEvent), true);
    expect(buttons[1].innerHTML).toBe('新建人物并查重');
  });

  test('insertControlBtnChara wires the character button click handler', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const anchor = document.querySelector('#anchor')!;

    insertControlBtnChara(anchor, handler);
    document
      .querySelector<HTMLElement>('.e-wiki-new-character')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(handler).toHaveBeenCalledWith(expect.any(MouseEvent));
  });

  test('addCharaUI submits the selected character name', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const anchor = document.querySelector('#anchor')!;

    addCharaUI(anchor, ['Alice', 'Bob'], handler);

    const select = document.querySelector<HTMLSelectElement>('.e-bnwh-select')!;
    select.value = 'Bob';
    document
      .querySelector<HTMLElement>('.e-wiki-new-character')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(handler).toHaveBeenCalledWith(expect.any(MouseEvent), 'Bob');
  });

  test('insertControlBtn returns the container so more controls can be appended', () => {
    const anchor = document.querySelector('#anchor')!;

    const container = insertControlBtn(
      anchor,
      vi.fn().mockResolvedValue(undefined)
    );

    expect(container).toBe(anchor.nextElementSibling);
  });

  test('insertControlBtnChara and addCharaUI return their containers', () => {
    const anchor = document.querySelector('#anchor')!;

    const charaContainer = insertControlBtnChara(
      anchor,
      vi.fn().mockResolvedValue(undefined)
    );
    expect(charaContainer).toBe(anchor.nextElementSibling);
    expect(charaContainer?.querySelector('.e-wiki-new-character')).not.toBeNull();

    const uiContainer = addCharaUI(
      anchor,
      ['Alice'],
      vi.fn().mockResolvedValue(undefined)
    );
    expect(uiContainer).toBe(anchor.nextElementSibling);
    expect(uiContainer?.classList.contains('e-bnwh-add-chara-wrap')).toBe(true);
  });

  test('appendExportBtn adds an export control that runs its handler', async () => {
    let finish: () => void = () => undefined;
    const handler = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const anchor = document.querySelector('#anchor')!;
    const container = insertControlBtn(
      anchor,
      vi.fn().mockResolvedValue(undefined)
    )!;

    appendExportBtn(container, handler);

    const exportButton = container.querySelector<HTMLElement>('.e-wiki-export-json')!;
    expect(exportButton.textContent).toBe('导出 JSON');
    expect(exportButton.classList.contains('e-wiki-new-subject')).toBe(true);

    exportButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(exportButton.textContent).toBe('导出中...');

    finish();
    await flushAsyncEvents();
    expect(exportButton.textContent).toBe('导出 JSON');
  });

  test('appendExportBtn restores its label when the handler fails', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const handler = vi.fn().mockRejectedValue(new Error('boom'));
    const anchor = document.querySelector('#anchor')!;
    const container = insertControlBtn(
      anchor,
      vi.fn().mockResolvedValue(undefined)
    )!;

    appendExportBtn(container, handler);
    const exportButton = container.querySelector<HTMLElement>('.e-wiki-export-json')!;
    exportButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(exportButton.textContent).toBe('导出 JSON');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
