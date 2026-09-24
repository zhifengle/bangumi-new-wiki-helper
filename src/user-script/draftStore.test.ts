import { vi } from 'vitest';
import { AUTO_FILL_FORM, PERSON_DATA } from './constants';
import { userScriptDraftStore } from './draftStore';

const store = new Map<string, unknown>();
const globalAny = globalThis as Record<string, unknown>;

describe('userScriptDraftStore person draft', () => {
  beforeEach(() => {
    store.clear();
    globalAny.GM_setValue = vi.fn((key: string, value: unknown) => {
      store.set(key, value);
    });
    globalAny.GM_getValue = vi.fn((key: string) => store.get(key));
    globalAny.GM_deleteValue = vi.fn((key: string) => {
      store.delete(key);
    });
  });

  afterAll(() => {
    delete globalAny.GM_setValue;
    delete globalAny.GM_getValue;
    delete globalAny.GM_deleteValue;
  });

  test('saves and loads the person draft as json', async () => {
    const personData = {
      infos: [{ name: '姓名', value: 'ZUN', category: 'crt_name' }],
    };

    await userScriptDraftStore.savePersonDraft(personData);
    expect(store.get(PERSON_DATA)).toBe(JSON.stringify(personData));
    expect(await userScriptDraftStore.loadPersonDraft()).toEqual(personData);
  });

  test('page state carries the person draft and clear removes it', async () => {
    store.set(PERSON_DATA, JSON.stringify({ infos: [] }));
    store.set(AUTO_FILL_FORM, 1);

    const state = await userScriptDraftStore.loadBangumiPageState();
    expect(state.personData).toEqual({ infos: [] });
    expect(state.shouldAutoFill).toBe(true);

    await userScriptDraftStore.clearBangumiPageState();
    expect(store.has(PERSON_DATA)).toBe(false);
    expect(await userScriptDraftStore.loadPersonDraft()).toBeNull();
  });
});
