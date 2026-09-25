// @vitest-environment jsdom
import { vi } from 'vitest';
import { SingleInfo } from '../interface/subjectInfo';
import { PersonSourceDefinition } from '../interface/wiki';
import { initSourcePerson } from './person';
import { SourceRuntimeAdapter } from './runtime';

const { mockGetPersonHooks } = vi.hoisted(() => ({
  mockGetPersonHooks: vi.fn(),
}));

vi.mock('../sites/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../sites/catalog')>();
  return {
    ...actual,
    getPersonHooks: mockGetPersonHooks,
  };
});

async function flushAsyncEvents() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function createModel(): PersonSourceDefinition {
  return {
    key: 'vgmdb_artist',
    description: 'test person',
    host: ['vgmdb.net'],
    pageSelectors: { selector: '#page' },
    controlSelector: { selector: '#title' },
    role: 2,
    professions: ['producer'],
    itemList: [
      { name: '姓名', selector: { selector: '#name' }, category: 'crt_name' },
    ],
  };
}

function createRuntime(): SourceRuntimeAdapter {
  return {
    fetchHtml: vi.fn().mockResolvedValue(''),
    hydratePersonCover: vi.fn().mockResolvedValue(undefined),
    submitSubjectCreation: vi.fn().mockResolvedValue(undefined),
    submitCharacterCreation: vi.fn().mockResolvedValue(undefined),
    submitPersonCreation: vi.fn().mockResolvedValue(undefined),
  };
}

function useHooks(
  beforeCreate: () => Promise<boolean>,
  afterGetWikiData: (infos: SingleInfo[]) => Promise<SingleInfo[]>
) {
  mockGetPersonHooks.mockImplementation(
    (_model: PersonSourceDefinition, timing: string) =>
      timing === 'beforeCreate' ? beforeCreate : afterGetWikiData
  );
}

function buttons() {
  return Array.from(
    document.querySelectorAll<HTMLElement>('.e-wiki-new-subject')
  );
}

describe('initSourcePerson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = `
      <div id="page">
        <h1 id="title">ZUN</h1>
        <span id="name">ZUN</span>
      </div>
    `;
    useHooks(
      async () => true,
      async (infos) => infos
    );
  });

  test('inserts person buttons and submits extracted data with defaults', async () => {
    const runtime = createRuntime();
    const model = createModel();

    await initSourcePerson(model, runtime);
    const [createButton, checkButton] = buttons();
    expect(createButton.innerHTML).toBe('新建人物');
    expect(checkButton.innerHTML).toBe('新建人物并查重');

    createButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(runtime.hydratePersonCover).toHaveBeenCalledTimes(1);
    expect(runtime.submitPersonCreation).toHaveBeenCalledWith({
      siteConfig: model,
      personData: {
        infos: [
          expect.objectContaining({
            name: '姓名',
            value: 'ZUN',
            category: 'crt_name',
          }),
          { name: 'crt_role', value: '2', category: 'select' },
          { name: 'prsn_pro[producer]', value: true, category: 'checkbox' },
          {
            name: '引用来源',
            value: location.origin + location.pathname,
            category: 'listItem',
          },
        ],
      },
      queryInfo: { name: 'ZUN' },
      shouldCheckDup: false,
    });
  });

  test('records the page url without query string or fragment as the source', async () => {
    window.history.replaceState({}, '', '/artist/2?ref=tracking#top');
    const runtime = createRuntime();

    await initSourcePerson(createModel(), runtime);
    buttons()[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    const submitted = (runtime.submitPersonCreation as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(submitted.personData.infos).toContainEqual({
      name: '引用来源',
      value: `${location.origin}/artist/2`,
      category: 'listItem',
    });
    window.history.replaceState({}, '', '/');
  });

  test('passes the duplicate-check flag from the second button', async () => {
    const runtime = createRuntime();

    await initSourcePerson(createModel(), runtime);
    buttons()[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(runtime.submitPersonCreation).toHaveBeenCalledWith(
      expect.objectContaining({
        queryInfo: { name: 'ZUN' },
        shouldCheckDup: true,
      })
    );
  });

  test('keeps hook-provided role, profession and source over the defaults', async () => {
    useHooks(
      async () => true,
      async (infos) => [
        ...infos,
        { name: 'crt_role', value: '3', category: 'select' },
        { name: 'prsn_pro[artist]', value: true, category: 'checkbox' },
        { name: '引用来源', value: 'https://vgmdb.net/org/1', category: 'listItem' },
      ]
    );
    const runtime = createRuntime();

    await initSourcePerson(createModel(), runtime);
    buttons()[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    const submitted = (runtime.submitPersonCreation as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    const infos: SingleInfo[] = submitted.personData.infos;
    expect(infos.filter((info) => info.name === 'crt_role')).toEqual([
      { name: 'crt_role', value: '3', category: 'select' },
    ]);
    expect(infos.filter((info) => info.category === 'checkbox')).toEqual([
      { name: 'prsn_pro[artist]', value: true, category: 'checkbox' },
    ]);
    expect(infos.filter((info) => info.name === '引用来源')).toEqual([
      { name: '引用来源', value: 'https://vgmdb.net/org/1', category: 'listItem' },
    ]);
  });

  test('still opens person/new when the portrait cannot be hydrated', async () => {
    const runtime = createRuntime();
    (runtime.hydratePersonCover as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('image fetch failed')
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await initSourcePerson(createModel(), runtime);
    buttons()[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(runtime.submitPersonCreation).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
  });

  test('does nothing when the page or control anchor is missing', async () => {
    document.body.innerHTML = '<div id="page"></div>';
    const runtime = createRuntime();

    await initSourcePerson(createModel(), runtime);

    expect(buttons()).toHaveLength(0);
    expect(mockGetPersonHooks).not.toHaveBeenCalled();
  });

  test('does nothing when the beforeCreate hook declines', async () => {
    useHooks(
      async () => false,
      async (infos) => infos
    );
    const runtime = createRuntime();

    await initSourcePerson(createModel(), runtime);

    expect(buttons()).toHaveLength(0);
  });
});
