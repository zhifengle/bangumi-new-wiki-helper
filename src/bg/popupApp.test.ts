/**
 * @jest-environment jsdom
 */
import browser from 'webextension-polyfill';
import { BangumiDomain } from '../sites/bangumi';
import { initPopupApp } from './popupApp';

jest.mock('webextension-polyfill', () => ({}));

function createBrowserMock(config: Record<string, unknown>) {
  return {
    storage: {
      local: {
        get: jest.fn().mockResolvedValue({ config }),
        set: jest.fn().mockResolvedValue(undefined),
      },
    },
  } as unknown as typeof browser;
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
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
    jest.clearAllMocks();
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
    await flushMicrotasks();

    const domain = document.querySelector<HTMLSelectElement>('select[name=domain]');
    domain!.value = '0';
    domain!.dispatchEvent(new Event('change', { bubbles: true }));
    await flushMicrotasks();

    expect(browserMock.storage.local.set).toHaveBeenNthCalledWith(1, {
      config: {
        domain: BangumiDomain.bgm,
        activeOpen: true,
        useHttps: true,
        autoFill: false,
        subjectId: 0,
      },
    });
    expect(browserMock.storage.local.set).toHaveBeenNthCalledWith(2, {
      config: {
        domain: BangumiDomain.bangumi,
        activeOpen: false,
        useHttps: true,
        autoFill: false,
        subjectId: 0,
      },
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
    await flushMicrotasks();

    expect(browserMock.storage.local.set).toHaveBeenCalledWith({
      wikiData: null,
    });
  });
});
