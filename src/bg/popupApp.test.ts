// @vitest-environment jsdom
import { vi } from 'vitest';
import browser from 'webextension-polyfill';
import { BangumiDomain } from '../sites/bangumi';
import { initPopupApp } from './popupApp';

vi.mock('webextension-polyfill', () => ({}));

function createBrowserMock(config: Record<string, unknown>) {
  return {
    storage: {
      local: {
        get: vi.fn(async () => ({ config })),
        set: vi.fn(async (update: { config?: Record<string, unknown> }) => {
          config = update.config ?? config;
        }),
      },
    },
  } as unknown as typeof browser;
}

async function flushStorage() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function renderPopupDom() {
  document.body.innerHTML = `
    <div class="setting-container">
      <ul>
        <li>
          <select name="domain">
            <option value="0">bangumi.tv</option>
            <option value="1">bgm.tv</option>
            <option value="2">chii.in</option>
          </select>
        </li>
        <li>
          <input name="activeOpen" type="checkbox" />
        </li>
        <li>
          <input name="useHttps" type="checkbox" />
        </li>
        <li>
          <input name="autoFill" type="checkbox" />
        </li>
        <li>
          <input name="useLegacyJsonSearch" type="checkbox" />
        </li>
        <li>
          <input name="fallbackToPersonWorks" type="checkbox" />
        </li>
        <li>
          <input name="showExportButtons" type="checkbox" />
        </li>
        <li>
          <input name="subjectId" type="number" />
        </li>
        <li>
          <input name="clearBtn" type="button" value="clear" />
        </li>
      </ul>
    </div>
  `;
}

describe('popupApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderPopupDom();
  });

  test('renders config values into popup controls', async () => {
    const browserMock = createBrowserMock({
      domain: BangumiDomain.chii,
      activeOpen: true,
      useHttps: false,
      autoFill: true,
      subjectId: 321,
    });

    await initPopupApp(document, browserMock);

    expect(
      document.querySelector<HTMLSelectElement>('select[name=domain]')?.value
    ).toBe('2');
    expect(
      document.querySelector<HTMLInputElement>('input[name=activeOpen]')?.checked
    ).toBe(true);
    expect(
      document.querySelector<HTMLInputElement>('input[name=useHttps]')?.checked
    ).toBe(false);
    expect(
      document.querySelector<HTMLInputElement>('input[name=autoFill]')?.checked
    ).toBe(true);
    expect(
      document.querySelector<HTMLInputElement>('input[name=showExportButtons]')?.checked
    ).toBe(false);
    expect(
      document.querySelector<HTMLInputElement>('input[name=subjectId]')?.value
    ).toBe('321');
  });

  test('persists checkbox and select changes with typed config values', async () => {
    const browserMock = createBrowserMock({
      domain: BangumiDomain.bgm,
      activeOpen: false,
      useHttps: true,
      autoFill: false,
      subjectId: 0,
    });

    await initPopupApp(document, browserMock);

    const activeOpen = document.querySelector<HTMLInputElement>(
      'input[name=activeOpen]'
    );
    activeOpen!.checked = true;
    activeOpen!.dispatchEvent(new Event('click', { bubbles: true }));
    await flushStorage();

    const domain = document.querySelector<HTMLSelectElement>('select[name=domain]');
    domain!.value = '0';
    domain!.dispatchEvent(new Event('change', { bubbles: true }));
    await flushStorage();

    expect(browserMock.storage.local.set).toHaveBeenNthCalledWith(1, {
      config: {
        domain: BangumiDomain.bgm,
        activeOpen: true,
        useHttps: true,
        autoFill: false,
        useLegacyJsonSearch: true,
        fallbackToPersonWorks: false,
        fallbackToWebSearch: false,
        showExportButtons: false,
        subjectId: 0,
      },
    });
    expect(browserMock.storage.local.set).toHaveBeenNthCalledWith(2, {
      config: {
        domain: BangumiDomain.bangumi,
        activeOpen: true,
        useHttps: true,
        autoFill: false,
        useLegacyJsonSearch: true,
        fallbackToPersonWorks: false,
        fallbackToWebSearch: false,
        showExportButtons: false,
        subjectId: 0,
      },
    });

    const exportToggle = document.querySelector<HTMLInputElement>(
      'input[name=showExportButtons]'
    )!;
    exportToggle.click();
    await flushStorage();
    expect(browserMock.storage.local.set).toHaveBeenLastCalledWith({
      config: expect.objectContaining({ showExportButtons: true }),
    });
  });

  test('uses the search defaults and preserves both toggles when changed together', async () => {
    const browserMock = createBrowserMock({});
    await initPopupApp(document, browserMock);

    const json = document.querySelector<HTMLInputElement>('input[name=useLegacyJsonSearch]')!;
    const people = document.querySelector<HTMLInputElement>('input[name=fallbackToPersonWorks]')!;
    expect(json.checked).toBe(true);
    expect(people.checked).toBe(false);

    json.click();
    people.click();
    await flushStorage();
    expect(browserMock.storage.local.set).toHaveBeenLastCalledWith({
      config: expect.objectContaining({ useLegacyJsonSearch: false, fallbackToPersonWorks: true }),
    });
  });

  test('clears cached wiki data from popup action', async () => {
    const browserMock = createBrowserMock({
      domain: BangumiDomain.bgm,
      activeOpen: false,
      useHttps: true,
      autoFill: false,
      subjectId: 0,
    });

    await initPopupApp(document, browserMock);
    document
      .querySelector<HTMLInputElement>('input[name=clearBtn]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushStorage();

    expect(browserMock.storage.local.set).toHaveBeenCalledWith({
      wikiData: null,
    });
  });
});
