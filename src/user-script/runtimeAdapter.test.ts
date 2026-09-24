import { vi, type MockedFunction } from 'vitest';

const { storageMock, mockCheckPersonAndOpenEntry } = vi.hoisted(() => ({
  storageMock: {
    saveSubjectDraft: vi.fn(),
    loadSubjectDraft: vi.fn(),
    saveCharacterDraft: vi.fn(),
    loadCharacterDraft: vi.fn(),
    savePersonDraft: vi.fn(),
    loadPersonDraft: vi.fn(),
    saveSubjectId: vi.fn(),
    loadSubjectId: vi.fn(),
    loadBangumiPageState: vi.fn(),
    clearBangumiPageState: vi.fn(),
  },
  mockCheckPersonAndOpenEntry: vi.fn(),
}));

vi.mock('./runtimeCapabilities', () => ({
  userScriptRuntimeCapabilities: {
    transport: { fetchHtml: vi.fn() },
    storage: storageMock,
  },
}));

vi.mock('../runtime/personCreation', () => ({
  checkPersonAndOpenEntry: mockCheckPersonAndOpenEntry,
}));

vi.mock('../utils/async/sleep', () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/log', () => ({
  logMessage: vi.fn(),
}));

import { userScriptRuntimeAdapter } from './runtimeAdapter';
import { AUTO_FILL_FORM } from './constants';

const globalAny = globalThis as Record<string, unknown>;
const values = new Map<string, unknown>();

const siteConfig = {
  key: 'vgmdb_artist' as const,
  description: 'VGMdb 艺术家',
  host: ['vgmdb.net'],
  pageSelectors: { selector: '#innermain' },
  controlSelector: { selector: '#innermain' },
  itemList: [],
};

describe('userScriptRuntimeAdapter person creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    values.clear();
    globalAny.GM_getValue = vi.fn((key: string) => values.get(key));
    globalAny.GM_setValue = vi.fn((key: string, value: unknown) => {
      values.set(key, value);
    });
    globalAny.GM_openInTab = vi.fn();
  });

  afterAll(() => {
    delete globalAny.GM_getValue;
    delete globalAny.GM_setValue;
    delete globalAny.GM_openInTab;
  });

  test('saves the draft, arms autofill and opens person/new without a duplicate check', async () => {
    const personData = { infos: [{ name: '姓名', value: 'ZUN', category: 'crt_name' }] };

    await userScriptRuntimeAdapter.submitPersonCreation({
      siteConfig,
      personData,
      queryInfo: { name: 'ZUN' },
      shouldCheckDup: false,
    });

    expect(storageMock.savePersonDraft).toHaveBeenCalledWith(personData);
    expect(values.get(AUTO_FILL_FORM)).toBe(1);
    expect(globalAny.GM_openInTab).toHaveBeenCalledWith('https://bgm.tv/person/new');
    expect(mockCheckPersonAndOpenEntry).not.toHaveBeenCalled();
  });

  test('routes the duplicate check through checkPersonAndOpenEntry with a host-aware runtime', async () => {
    const personData = { infos: [{ name: '姓名', value: '折戸伸治', category: 'crt_name' }] };

    await userScriptRuntimeAdapter.submitPersonCreation({
      siteConfig,
      personData,
      queryInfo: { name: '折戸伸治' },
      shouldCheckDup: true,
    });

    expect(storageMock.savePersonDraft).toHaveBeenCalledWith(personData);
    const mocked = mockCheckPersonAndOpenEntry as MockedFunction<
      (payload: { name: string }, runtime: {
        bangumi: { host: string };
        openExistingPerson(url: string): Promise<void>;
        openNewPerson(): Promise<void>;
      }) => Promise<void>
    >;
    expect(mocked).toHaveBeenCalledWith(
      { name: '折戸伸治' },
      expect.objectContaining({ bangumi: { host: 'https://bgm.tv' } })
    );
    const runtime = mocked.mock.calls[0][1];

    await runtime.openExistingPerson('/person/1915');
    expect(globalAny.GM_openInTab).toHaveBeenCalledWith('https://bgm.tv/person/1915');
    expect(values.get(AUTO_FILL_FORM)).toBeUndefined();

    await runtime.openNewPerson();
    expect(globalAny.GM_openInTab).toHaveBeenCalledWith('https://bgm.tv/person/new');
    expect(values.get(AUTO_FILL_FORM)).toBe(1);
  });
});
