// @vitest-environment jsdom
import { setExportButtonsVisible } from '../sites/core/controls';
import { vi } from 'vitest';
import { SingleInfo } from '../interface/subjectInfo';
import { PersonSourceDefinition } from '../interface/wiki';
import { clearDebugSources, registerDebugSource, showCurrentPageDebugTool } from './export';
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

function debugRoot() {
  return document.querySelector<HTMLElement>('.e-bnwh-debug-host')!.shadowRoot!;
}

function readDebugJson() {
  return JSON.parse(
    debugRoot().querySelector<HTMLTextAreaElement>('textarea.e-bnwh-debug-json')!.value
  );
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
    clearDebugSources();
    setExportButtonsVisible(false);
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

  test('diagnoses field selectors and keeps the original JSON export', async () => {
    setExportButtonsVisible(true);
    const runtime = createRuntime();
    const model = createModel();
    model.itemList = [
      {
        name: '姓名',
        selector: [{ selector: '#old-name' }, { selector: '#name' }, { selector: '#unused' }],
        category: 'crt_name',
      },
      { name: '缺失字段', selector: { selector: '#missing' } },
      { name: '空值字段', selector: { selector: '#empty' } },
      { name: '无效规则', selector: { selector: '[' } },
      {
        name: '处理出错',
        selector: { selector: '#name' },
        pipes: [() => { throw new Error('pipe failed'); }],
      },
    ];
    const empty = document.createElement('span');
    empty.id = 'empty';
    document.body.append(empty);

    await initSourcePerson(model, runtime);
    document
      .querySelector<HTMLElement>('.e-wiki-export-json')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    const exported = readDebugJson();
    expect(exported).toMatchObject({
      format: 'bnwh-export/1',
      kind: 'person',
      site: 'vgmdb_artist',
      sourceUrl: location.href,
    });
    expect(exported.data.infos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '姓名',
          value: 'ZUN',
          category: 'crt_name',
        }),
        { name: 'crt_role', value: '2', category: 'select' },
      ])
    );
    expect(runtime.hydratePersonCover).toHaveBeenCalledTimes(1);
    expect(runtime.submitPersonCreation).not.toHaveBeenCalled();
    expect(exported).not.toHaveProperty('selectorChecks');
    const root = debugRoot();
    root.querySelector<HTMLButtonElement>('button[data-panel=selectors]')!.click();
    const panel = root.querySelector<HTMLElement>('section[data-panel=selectors]')!;
    expect(panel.hidden).toBe(false);
    expect(Array.from(panel.querySelectorAll('summary'), (item) => item.textContent))
      .toEqual([
        '姓名 · 后备规则命中 · 页面',
        '缺失字段 · 未命中 · 页面',
        '空值字段 · 命中但未提取到值 · 页面',
        '无效规则 · 选择器报错 · 页面',
        '处理出错 · 取值报错 · 页面',
      ]);
    expect(panel.textContent).toContain('未命中 {"selector":"#old-name"}');
    expect(panel.textContent).toContain('命中 {"selector":"#name"} → span#name');
    expect(panel.textContent).not.toContain('#unused');

    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    try {
      root.querySelector<HTMLButtonElement>('.e-bnwh-debug-copy-report')!.click();
      await flushAsyncEvents();
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('## 选择器诊断'));
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('#old-name'));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  test.each([
    ['page', '页面识别'],
    ['title', '按钮挂载位置'],
  ])('diagnoses a missing %s anchor from the menu', async (id, label) => {
    document.getElementById(id)!.remove();
    const runtime = createRuntime();
    const model = { ...createModel(), urlRules: [/\/artist\/2$/] };
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      window.history.replaceState({}, '', '/artist/2');
      const otherSource = vi.fn();
      registerDebugSource({
        id: 'subject:vgmdb',
        label: 'VGMdb 专辑',
        menuFallback: 'host-match',
        collect: otherSource,
      });
      await initSourcePerson(model, runtime);
      expect(buttons()).toHaveLength(0);
      expect(mockGetPersonHooks).not.toHaveBeenCalled();

      await showCurrentPageDebugTool();
      const panel = debugRoot().querySelector<HTMLElement>('section[data-panel=selectors]')!;
      expect(panel.hidden).toBe(false);
      expect(panel.textContent).toContain(`${label} · 未命中`);
      expect(panel.textContent).toContain(`#${id}`);
      expect(runtime.hydratePersonCover).not.toHaveBeenCalled();
      expect(otherSource).not.toHaveBeenCalled();
    } finally {
      window.history.replaceState({}, '', '/');
      log.mockRestore();
    }
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
