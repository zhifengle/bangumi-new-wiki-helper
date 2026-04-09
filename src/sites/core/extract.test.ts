// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { vi } from 'vitest';
import { SingleInfo } from '../../interface/subjectInfo';
import {
  CharacterSourceDefinition,
  InfoConfig,
  SubjectSourceDefinition,
  SubjectTypeId,
} from '../../interface/wiki';
import * as catalog from '../catalog';
import { createWikiExtractContext } from './context';
import { dealItemText, getCharaData, getWikiData } from './extract';
import { steamdbSubject } from '../steamdb/subject';
import { amazonJpBookSubject } from '../amazonJpBook/subject';

function readHtmlFixture(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

function createTestSubject(itemList: InfoConfig[]): SubjectSourceDefinition {
  return {
    key: 'steam_game',
    description: 'test subject',
    host: [],
    pageSelectors: [{ selector: '#root' }],
    controlSelector: { selector: '#root' },
    type: SubjectTypeId.game,
    itemList,
  };
}

function createTestChara(itemList: InfoConfig[]): CharacterSourceDefinition {
  return {
    key: 'getchu_game_chara',
    siteKey: 'getchu_game',
    description: 'test chara',
    itemSelector: { selector: '.item' },
    type: SubjectTypeId.game,
    itemList,
  };
}

describe('core extract helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('dealItemText normalizes prefixed metadata text', () => {
    expect(dealItemText('言語: 日本語', '', ['言語'])).toEqual('日本語');
    expect(dealItemText('言語： 日本語', '', ['言語'])).toEqual('日本語');
    expect(dealItemText('言語 日本語', '', ['言語'])).toEqual('日本語');
    expect(dealItemText('言語:       日本語', '', ['言語'])).toEqual('日本語');
    expect(
      dealItemText('出版社: 少年画報社 (2019/7/8)', '', ['出版社'])
    ).toEqual('少年画報社');
    expect(
      dealItemText('コミック: 184ページ', '', ['コミック', 'ページ'])
    ).toEqual('184');
    expect(dealItemText('コミック: 184ページ', '', ['ページ'])).toEqual('184');
    expect(
      dealItemText('KOTOKO（I’ve）、fripSide、彩菜（I’ve）', '', [])
    ).toEqual('KOTOKO、fripSide、彩菜');
    expect(
      dealItemText('29 October 2019 – 00:01:22 UTC (9 months ago)')
    ).toEqual('29 October 2019 – 00:01:22 UTC');
  });

  test('getWikiData extracts steamdb wiki data', async () => {
    const dom = new DOMParser().parseFromString(
      readHtmlFixture('../../data/SteamDB.html'),
      'text/html'
    );
    const infos = await getWikiData(
      steamdbSubject,
      createWikiExtractContext(dom)
    );

    expect(infos).toHaveLength(9);
    expect(infos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '游戏名',
          value: 'ライザのアトリエ ～常闇の女王と秘密の隠れ家～',
          category: 'subject_title',
        }),
      ])
    );
  });

  test('getWikiData extracts amazon jp book wiki data', async () => {
    const dom = new DOMParser().parseFromString(
      readHtmlFixture('../../data/amazon-book.html'),
      'text/html'
    );
    const infos = await getWikiData(
      amazonJpBookSubject,
      createWikiExtractContext(dom)
    );

    expect(infos).toHaveLength(9);
    expect(infos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '名称',
          value: 'たゆたいエマノン',
          category: 'subject_title',
        }),
        expect.objectContaining({
          name: 'ISBN',
          value: '978-4198643829',
          category: 'ISBN',
        }),
        expect.objectContaining({
          name: 'ASIN',
          value: '4198643822',
          category: 'ASIN',
        }),
        expect.objectContaining({
          name: '发售日',
          value: '2017-04-07',
          category: 'date',
        }),
        expect.objectContaining({
          name: '作者',
          value: '梶尾真治',
          category: 'creator',
        }),
        expect.objectContaining({
          name: '出版社',
          value: '徳間書店',
        }),
        expect.objectContaining({
          name: '页数',
          value: '221',
        }),
      ])
    );
  });

  test('getWikiData extracts amazon jp book cn wiki data', async () => {
    const dom = new DOMParser().parseFromString(
      readHtmlFixture('../../data/amazon-book-cn.html'),
      'text/html'
    );
    const infos = await getWikiData(
      amazonJpBookSubject,
      createWikiExtractContext(dom)
    );

    expect(infos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '名称',
          value: 'たゆたいエマノン',
          category: 'subject_title',
        }),
        expect.objectContaining({
          name: 'ISBN',
          value: '978-4198643829',
          category: 'ISBN',
        }),
        expect.objectContaining({
          name: '发售日',
          value: '2017-04-07',
          category: 'date',
        }),
        expect.objectContaining({
          name: '作者',
          value: '梶尾真治',
          category: 'creator',
        }),
        expect.objectContaining({
          name: '出版社',
          value: '徳間書店',
          category: undefined,
        }),
        expect.objectContaining({
          name: '页数',
          value: '221',
          category: undefined,
        }),
        expect.objectContaining({
          name: 'ASIN',
          value: '4198643822',
          category: 'ASIN',
        }),
      ])
    );
  });

  test('getWikiData prefers innerText for summary categories', async () => {
    vi
      .spyOn(catalog, 'getSubjectHooks')
      .mockReturnValue(async (infos: SingleInfo[]) => infos);
    const doc = document.implementation.createHTMLDocument('wiki');
    doc.body.innerHTML = `
      <div id="root"></div>
      <div id="summary">text content fallback</div>
    `;
    const summary = doc.querySelector('#summary') as HTMLElement;
    Object.defineProperty(summary, 'innerText', {
      configurable: true,
      value: '第一行\n第二行',
    });

    const infos = await getWikiData(
      createTestSubject([
        {
          name: '简介',
          selector: { selector: '#summary' },
          category: 'subject_summary',
        },
      ]),
      createWikiExtractContext(doc)
    );

    expect(infos).toEqual([
      expect.objectContaining({
        name: '简介',
        value: '第一行\n第二行',
        category: 'subject_summary',
      }),
    ]);
  });

  test('getWikiData skips failed items without aborting the page', async () => {
    vi
      .spyOn(catalog, 'getSubjectHooks')
      .mockReturnValue(async (infos: SingleInfo[]) => infos);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const doc = document.implementation.createHTMLDocument('wiki');
    doc.body.innerHTML = `
      <div id="root"></div>
      <div id="good">标题</div>
      <div id="bad">炸掉</div>
    `;

    const infos = await getWikiData(
      createTestSubject([
        {
          name: '名称',
          selector: { selector: '#good' },
          category: 'subject_title',
        },
        {
          name: '异常字段',
          selector: { selector: '#bad' },
          pipes: [
            () => {
              throw new Error('pipe exploded');
            },
          ],
        },
      ]),
      createWikiExtractContext(doc)
    );

    expect(infos).toEqual([
      expect.objectContaining({
        name: '名称',
        value: '标题',
        category: 'subject_title',
      }),
    ]);
    expect(errorSpy).toHaveBeenCalled();
  });

  test('getWikiData allows hook to clear all infos with empty array', async () => {
    vi.spyOn(catalog, 'getSubjectHooks').mockReturnValue(async () => []);
    const doc = document.implementation.createHTMLDocument('wiki');
    doc.body.innerHTML = `
      <div id="root"></div>
      <div id="title">标题</div>
    `;

    const infos = await getWikiData(
      createTestSubject([
        {
          name: '名称',
          selector: { selector: '#title' },
          category: 'subject_title',
        },
      ]),
      createWikiExtractContext(doc)
    );

    expect(infos).toEqual([]);
  });

  test('getWikiData keeps selector queries scoped to the provided root', async () => {
    vi
      .spyOn(catalog, 'getSubjectHooks')
      .mockReturnValue(async (infos: SingleInfo[]) => infos);
    document.body.innerHTML = '<div id="title">全局标题</div>';
    const doc = document.implementation.createHTMLDocument('wiki');
    doc.body.innerHTML = '<div id="title">局部标题</div>';

    const infos = await getWikiData(
      createTestSubject([
        {
          name: '名称',
          selector: { selector: '#title' },
          category: 'subject_title',
        },
      ]),
      createWikiExtractContext(doc)
    );

    expect(infos).toEqual([
      expect.objectContaining({
        name: '名称',
        value: '局部标题',
        category: 'subject_title',
      }),
    ]);
  });

  test('getWikiData still surfaces hook failures', async () => {
    vi.spyOn(catalog, 'getSubjectHooks').mockReturnValue(async () => {
      throw new Error('hook failed');
    });
    const doc = document.implementation.createHTMLDocument('wiki');
    doc.body.innerHTML = `
      <div id="root"></div>
      <div id="title">标题</div>
    `;

    await expect(
      getWikiData(
        createTestSubject([
          {
            name: '名称',
            selector: { selector: '#title' },
            category: 'subject_title',
          },
        ]),
        createWikiExtractContext(doc)
      )
    ).rejects.toThrow('hook failed');
  });

  test('getCharaData skips failed items without aborting the character block', async () => {
    vi
      .spyOn(catalog, 'getCharacterHooks')
      .mockReturnValue(async (infos: SingleInfo[]) => infos);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const doc = document.implementation.createHTMLDocument('chara');
    doc.body.innerHTML = `
      <div class="item">
        <div class="good">角色名</div>
        <div class="bad">炸掉</div>
      </div>
    `;
    const item = doc.querySelector('.item');

    const infos = await getCharaData(
      createTestChara([
        {
          name: '角色名',
          selector: { selector: '.good' },
          category: 'subject_title',
        },
        {
          name: '异常字段',
          selector: { selector: '.bad' },
          pipes: [
            () => {
              throw new Error('pipe exploded');
            },
          ],
        },
      ]),
      createWikiExtractContext(item!)
    );

    expect(infos).toEqual([
      expect.objectContaining({
        name: '角色名',
        value: '角色名',
        category: 'subject_title',
      }),
    ]);
    expect(errorSpy).toHaveBeenCalled();
  });

  test('getCharaData keeps selector queries scoped to the provided item root', async () => {
    vi
      .spyOn(catalog, 'getCharacterHooks')
      .mockReturnValue(async (infos: SingleInfo[]) => infos);
    document.body.innerHTML = `
      <div class="item">
        <div class="good">全局角色</div>
      </div>
    `;
    const doc = document.implementation.createHTMLDocument('chara');
    doc.body.innerHTML = `
      <div class="item">
        <div class="good">局部角色</div>
      </div>
    `;
    const item = doc.querySelector('.item');

    const infos = await getCharaData(
      createTestChara([
        {
          name: '角色名',
          selector: { selector: '.good' },
          category: 'subject_title',
        },
      ]),
      createWikiExtractContext(item!)
    );

    expect(infos).toEqual([
      expect.objectContaining({
        name: '角色名',
        value: '局部角色',
        category: 'subject_title',
      }),
    ]);
  });
});
