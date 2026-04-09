// @vitest-environment jsdom
import { vi } from 'vitest';
import { dmmSubject } from '../sites/dmm/subject';
import { createWikiExtractContext } from '../sites/core/context';
import { getWikiData } from '../sites/core/extract';
import { initSourceSubject } from './subject';
import { SourceRuntimeAdapter } from './runtime';

async function flushAsyncEvents() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

const demoSummaryLines = ['Demo Summary', 'Line One', 'Line Two'];
const demoStoryLines = [
  'This is the demo story opening.',
  'The protagonist arrives in a quiet town and meets a new cast of characters.',
  'A small incident gradually leads into the main plot.',
];
const demoDividerLine = '-'.repeat(24);

const modernDmmDetailHtml = `
  <li class="ntgnav-mainItem is-active">
    <span>有料ゲーム</span>
  </li>
  <div class="productTitle">
    <h1 class="productTitle__item productTitle__item--headline">
      Demo Adventure
    </h1>
  </div>
  <div class="productLayout__secondaryColumn">
    <div class="contentsDetailTop__table">
      <div class="contentsDetailTop__tableRow">
        <div class="contentsDetailTop__tableDataLeft">
          <p>ブランド</p>
        </div>
        <div class="contentsDetailTop__tableDataRight">
          <a>Demo Brand</a>
        </div>
      </div>
    </div>
    <div class="contentsDetailBottom__table">
      <div class="contentsDetailBottom__tableRow">
        <div class="contentsDetailBottom__tableDataLeft">
          <p>ダウンロード版配信開始日</p>
        </div>
        <div class="contentsDetailBottom__tableDataRight">
          <span>2025/01/23 00:00</span>
        </div>
      </div>
      <div class="contentsDetailBottom__tableRow">
        <div class="contentsDetailBottom__tableDataLeft">
          <p>ゲームジャンル</p>
        </div>
        <div class="contentsDetailBottom__tableDataRight">
          <p>Demo Slice-of-Life ADV</p>
        </div>
      </div>
      <div class="contentsDetailBottom__tableRow">
        <div class="contentsDetailBottom__tableDataLeft">
          <p>原画</p>
        </div>
        <div class="contentsDetailBottom__tableDataRight">
          <ul>
            <li><a>Demo Artist</a></li>
          </ul>
        </div>
      </div>
      <div class="contentsDetailBottom__tableRow">
        <div class="contentsDetailBottom__tableDataLeft">
          <p>シナリオ</p>
        </div>
        <div class="contentsDetailBottom__tableDataRight">
          <ul>
            <li><a>Demo Writer A</a></li>
            <li><a>Demo Writer B</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <section class="universalSection">
    <h2 class="universalSection__headline">商品説明</h2>
    <div class="read-text-area pbe-m">
      <p class="text-overflow">Demo Summary<br>Line One<br>Line Two</p>
    </div>
  </section>
`;

describe('DMM subject page', () => {
  beforeEach(() => {
    document.body.innerHTML = modernDmmDetailHtml;
    const summary = document.querySelector('.text-overflow') as HTMLElement;
    Object.defineProperty(summary, 'innerText', {
      configurable: true,
      value: demoSummaryLines.join('\n'),
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('extracts subject infos from the current DMM detail layout', async () => {
    const infos = await getWikiData(
      dmmSubject,
      createWikiExtractContext(document)
    );

    expect(infos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '游戏名',
          value: 'Demo Adventure',
          category: 'subject_title',
        }),
        expect.objectContaining({
          name: '开发',
          value: 'Demo Brand',
        }),
        expect.objectContaining({
          name: '发行日期',
          value: '2025-01-23',
          category: 'date',
        }),
        expect.objectContaining({
          name: '游戏类型',
          value: 'Demo Slice-of-Life ADV',
        }),
        expect.objectContaining({
          name: '原画',
          value: 'Demo Artist',
        }),
        expect.objectContaining({
          name: '剧本',
          value: expect.stringContaining('Demo Writer A'),
        }),
        expect.objectContaining({
          name: '游戏简介',
          value: demoSummaryLines.join('\n'),
          category: 'subject_summary',
        }),
      ])
    );
  });

  test('strips leading patch notices from the current DMM summary', async () => {
    const summary = document.querySelector('.text-overflow') as HTMLElement;
    Object.defineProperty(summary, 'innerText', {
      configurable: true,
      value: [
        '2025/11/10 Demo patch notice.',
        '',
        'Update details',
        'Adjusted demo asset bundle.',
        '',
        demoDividerLine,
        '',
        '※Demo patch available now.',
        'If the issue remains, please download the updated package and apply it.',
        'See the official site for the demo patch instructions.',
        '',
        demoDividerLine,
        '',
        ...demoStoryLines,
      ].join('\n'),
    });

    const infos = await getWikiData(
      dmmSubject,
      createWikiExtractContext(document)
    );

    expect(infos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '游戏简介',
          value: demoStoryLines.join('\n'),
          category: 'subject_summary',
        }),
      ])
    );
  });

  test('mounts the subject controls on the modern DMM title and submits data', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const runtime: SourceRuntimeAdapter = {
      fetchHtml: vi.fn().mockResolvedValue(''),
      hydrateSubjectCover: vi.fn().mockResolvedValue(undefined),
      hydrateCharacterCover: vi.fn().mockResolvedValue(undefined),
      submitSubjectCreation: vi.fn().mockResolvedValue(undefined),
      submitCharacterCreation: vi.fn().mockResolvedValue(undefined),
    };

    await initSourceSubject(dmmSubject, runtime);

    const buttons = document.querySelectorAll<HTMLElement>('.e-wiki-new-subject');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].parentElement?.previousElementSibling).toBe(
      document.querySelector('.productTitle')
    );

    buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(runtime.submitSubjectCreation).toHaveBeenCalledWith(
      expect.objectContaining({
        siteConfig: dmmSubject,
        wikiData: expect.objectContaining({
          type: dmmSubject.type,
          infos: expect.arrayContaining([
            expect.objectContaining({
              name: '游戏名',
              value: 'Demo Adventure',
              category: 'subject_title',
            }),
          ]),
        }),
      })
    );

    infoSpy.mockRestore();
  });
});
