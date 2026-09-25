import { vi } from 'vitest';

const { storageMock } = vi.hoisted(() => ({
  storageMock: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      local: storageMock,
    },
  },
}));

import { browserDraftStore } from './draftStore';

describe('browserDraftStore person draft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('saves and loads the person draft', async () => {
    const personData = {
      infos: [{ name: '姓名', value: 'ZUN', category: 'crt_name' }],
    };

    await browserDraftStore.savePersonDraft(personData);
    expect(storageMock.set).toHaveBeenCalledWith({ personData });

    storageMock.get.mockResolvedValue({ personData });
    expect(await browserDraftStore.loadPersonDraft()).toEqual(personData);
    expect(storageMock.get).toHaveBeenCalledWith(['personData']);
  });

  test('exposes the person draft in page state and clears it with the others', async () => {
    storageMock.get.mockResolvedValue({
      config: { autoFill: true },
      personData: { infos: [] },
    });

    const state = await browserDraftStore.loadBangumiPageState();
    expect(state.personData).toEqual({ infos: [] });
    expect(state.shouldAutoFill).toBe(true);

    await browserDraftStore.clearBangumiPageState();
    expect(storageMock.remove).toHaveBeenCalledWith([
      'wikiData',
      'charaData',
      'personData',
    ]);
  });

  test('clears only the person draft on request', async () => {
    await browserDraftStore.clearPersonDraft();

    expect(storageMock.remove).toHaveBeenCalledWith(['personData']);
  });
});
