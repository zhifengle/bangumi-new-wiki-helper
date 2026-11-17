// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { vi } from 'vitest';
import { SingleInfo } from '../../interface/subjectInfo';
import {
  CharacterSourceDefinition,
  InfoConfig,
  PersonSourceDefinition,
  SubjectSourceDefinition,
  SubjectTypeId,
} from '../../interface/wiki';
import * as catalog from '../catalog';
import { createWikiExtractContext } from './context';
import {
  dealItemText,
  getCharaData,
  getPersonData,
  getWikiData,
} from './extract';
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

function createTestPerson(itemList: InfoConfig[]): PersonSourceDefinition {
  return {
    key: 'vgmdb_artist',
    description: 'test person',
    host: ['vgmdb.net'],
    pageSelectors: { selector: '#root' },
    controlSelector: { selector: '#root' },
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

  test('getWikiData extracts the current amazon book fields and alternate price/cover markup', async () => {
    const dom = new DOMParser().parseFromString(
      `
        <span id="productTitle">ジャヒー様はくじけない!(2) (ガンガンコミックスJOKER)</span>
        <div id="bylineInfo">
          <span class="author"><a>昆布わかめ</a><span>(著)</span></span>
        </div>
        <div id="richProductInformation_feature_div">
          <ol class="a-carousel">
            <li>本の長さ 175ページ</li>
            <li>出版社 スクウェア・エニックス</li>
            <li>発売日 2018/4/21</li>
            <li>ISBN-10 4757556977</li>
            <li>ISBN-13 978-4757556973</li>
          </ol>
        </div>
        <div id="corePriceDisplay_desktop_feature_div">
          <span class="priceToPay"><span class="a-offscreen">￥770</span></span>
        </div>
        <img id="landingImage"
          src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==">
      `,
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
          value: 'ジャヒー様はくじけない!(2)',
          category: 'subject_title',
        }),
        expect.objectContaining({
          name: 'ASIN',
          value: '4757556977',
          category: 'ASIN',
        }),
        expect.objectContaining({
          name: 'ISBN',
          value: '978-4757556973',
          category: 'ISBN',
        }),
        expect.objectContaining({
          name: '发售日',
          value: '2018-04-21',
          category: 'date',
        }),
        expect.objectContaining({
          name: '出版社',
          value: 'スクウェア・エニックス',
        }),
        expect.objectContaining({ name: '页数', value: '175' }),
        expect.objectContaining({
          name: '作者',
          value: '昆布わかめ',
          category: 'creator',
        }),
        expect.objectContaining({ name: '价格', value: '￥770' }),
        expect.objectContaining({
          name: 'cover',
          category: 'cover',
          value: expect.objectContaining({
            url: expect.stringMatching(/^data:image\/gif;base64,/),
          }),
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

  test('getPersonData extracts labelled rows and appends default infos', async () => {
    vi
      .spyOn(catalog, 'getPersonHooks')
      .mockReturnValue(async (infos: SingleInfo[]) => infos);
    document.body.innerHTML = `
      <div id="root">
        <div id="leftfloat">
          <div><b>Birthplace</b><br>Hyogo</div>
          <div><b>Bloodtype</b><br>A</div>
        </div>
      </div>
    `;
    const model = createTestPerson([
      {
        name: '血型',
        selector: {
          selector: '#leftfloat',
          subSelector: 'div > b',
          keyWord: 'Bloodtype',
          closest: 'div',
        },
      },
    ]);
    model.defaultInfos = [
      { name: '引用来源', value: 'https://vgmdb.net/artist/2', category: 'listItem' },
    ];

    const infos = await getPersonData(model, createWikiExtractContext(document));

    expect(infos).toEqual([
      expect.objectContaining({ name: '血型', value: 'A' }),
      { name: '引用来源', value: 'https://vgmdb.net/artist/2', category: 'listItem' },
    ]);
  });

  test('getPersonData replaces raw infos with the hook result', async () => {
    vi
      .spyOn(catalog, 'getPersonHooks')
      .mockReturnValue(async (infos: SingleInfo[]) => [
        ...infos,
        { name: '性别', value: '男' },
      ]);
    document.body.innerHTML = `<div id="root"><span id="name">ZUN</span></div>`;

    const infos = await getPersonData(
      createTestPerson([
        { name: '姓名', selector: { selector: '#name' }, category: 'crt_name' },
      ]),
      createWikiExtractContext(document)
    );

    expect(infos).toEqual([
      expect.objectContaining({ name: '姓名', value: 'ZUN', category: 'crt_name' }),
      { name: '性别', value: '男' },
    ]);
  });
});
