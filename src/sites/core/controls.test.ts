// @vitest-environment jsdom
import { vi } from 'vitest';
import {
  addCharaUI,
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
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const handler = vi.fn().mockRejectedValue('notmatched');
    const anchor = document.querySelector('#anchor')!;

    insertControlBtn(anchor, handler);
    const duplicateButton = document.querySelectorAll<HTMLElement>(
      '.e-wiki-new-subject'
    )[1];

    duplicateButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(duplicateButton.innerHTML).toBe('未查到条目');
    expect(errorSpy).toHaveBeenCalledWith('notmatched');
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
});
