// @vitest-environment jsdom
import { vi } from 'vitest';
import { SubjectTypeId } from '../../../interface/wiki';
import { amazonJpBookSubject } from '../../amazonJpBook/subject';
import { jdBookSubject } from '../../jdBook/subject';
import { createWikiExtractContext } from '../context';
import { getCharaData, getWikiData } from '../extract';
import {
  attr,
  cleanText,
  compileFieldPlan,
  cover,
  date,
  dateFromFirstMatch,
  dateRangeStart,
  dom,
  extractFields,
  fieldKind,
  firstOf,
  meta,
  number,
  queryParam,
  removeLabel,
  strip,
  text,
} from './index';

vi.mock('../../../utils/dealImage', () => ({
  getImageDataByURL: vi.fn((url: string) => Promise.resolve(`data:${url}`)),
}));

describe('extraction runtime', () => {
  test('compiles field defaults and explicit overrides into FieldPlan', () => {
    const field = {
      name: '名称',
      source: dom('.title'),
      kind: fieldKind.cover(),
      read: text(),
      clean: cleanText.trim(),
      emit: { category: 'subject_title' },
    };

    const plan = compileFieldPlan(field);

    expect(plan).toMatchObject({
      name: '名称',
      source: field.source,
      reader: field.read,
      cleaner: field.clean,
      parsers: [],
      transforms: [],
      emit: {
        empty: 'skip',
        category: 'subject_title',
      },
    });
  });

  test('extracts through source read clean parse and emit stages', async () => {
    const doc = document.implementation.createHTMLDocument('wiki');
    doc.body.innerHTML = `
      <div id="root">
        <dl><dt>発売日</dt><dd>発売日: 2024/05/02</dd></dl>
        <a class="site" href="https://example.test/game">公式</a>
      </div>
    `;

    const infos = await getWikiData(
      {
        key: 'steam_game',
        description: 'test',
        host: [],
        type: SubjectTypeId.game,
        pageSource: dom('#root'),
        controlSource: dom('#root'),
        itemList: [
          {
            name: '发售日',
            source: dom('dt').hasText('発売日').next(),
            clean: cleanText.chain([strip('発売日'), removeLabel()]),
            parse: date(),
            emit: { category: 'date' },
          },
          {
            name: 'website',
            source: dom('.site'),
            read: attr('href'),
            clean: false,
            emit: { category: 'website' },
          },
        ],
      },
      createWikiExtractContext(doc)
    );

    expect(infos).toEqual([
      { name: '发售日', value: '2024-05-02', category: 'date' },
      { name: 'website', value: 'https://example.test/game', category: 'website' },
    ]);
  });

  test('parses date fragments and date range starts explicitly', async () => {
    expect(dateFromFirstMatch().parse('販売日 2024年05月02日 0時')).toBe(
      '2024-05-02'
    );
    expect(dateFromFirstMatch().parse('配信開始日: 2024/05/02 10:00')).toBe(
      '2024-05-02'
    );
    expect(dateRangeStart().parse('2 May, 2024 – 2 years ago')).toBe(
      '2024-05-02'
    );
  });

  test('supports firstOf, allItems, meta and numeric parsing', async () => {
    const doc = document.implementation.createHTMLDocument('wiki');
    doc.head.innerHTML = '<meta property="og:title" content="Fallback Title">';
    doc.body.innerHTML = `
      <ul><li class="tag">页数: 123 页</li><li class="tag">ignored</li></ul>
      <div class="names"><span>A</span><span>B</span></div>
    `;

    const infos = await getWikiData(
      {
        key: 'steam_game',
        description: 'test',
        host: [],
        type: SubjectTypeId.game,
        pageSource: dom('body'),
        controlSource: dom('body'),
        itemList: [
          {
            name: '名称',
            source: firstOf([dom('.missing'), meta({ property: 'og:title' })]),
            read: attr('content'),
            emit: { category: 'subject_title' },
          },
          {
            name: '页数',
            source: dom('.tag').hasText('页数'),
            parse: number(),
          },
          {
            name: '别名',
            source: dom('.names span').allItems(),
            read: { read: (source) => Array.isArray(source) ? source.map((el) => el.textContent) as string[] : [] },
            clean: false,
            emit: { category: 'alias' },
          },
        ],
      },
      createWikiExtractContext(doc)
    );

    expect(infos).toEqual([
      { name: '名称', value: 'Fallback Title', category: 'subject_title' },
      { name: '页数', value: '123', category: undefined },
      { name: '别名', value: ['A', 'B'], category: 'alias' },
    ]);
  });

  test('validates numeric source text before extracting number', () => {
    const pageParser = number({
      rejectIfIncludes: '予約商品',
      maxInputLength: 20,
    });

    expect(pageParser.parse('本の長さ 221ページ')).toBe('221');
    expect(pageParser.parse('予約商品 221ページ')).toBe('');
    expect(pageParser.parse('これはかなり長い説明テキストです 221ページ')).toBe('');
  });

  test('parses query params from urls', () => {
    expect(
      queryParam('url').parse(
        'fixture://steamcommunity.com/linkfilter/?url=fixture://aokana.nekonyansoft.com/'
      )
    ).toBe('fixture://aokana.nekonyansoft.com/');
    expect(queryParam('url').parse('https://store.steampowered.com/linkfilter/')).toBe(
      ''
    );
  });

  test('strips location-only keyword from JD author field', async () => {
    const doc = document.implementation.createHTMLDocument('wiki');
    doc.body.innerHTML = '<div id="p-author">左小翎，壳小杀 著</div>';

    const infos = await extractFields(jdBookSubject.itemList, {
      root: doc,
      site: 'jd_book',
    });

    expect(infos).toEqual([
      {
        name: '作者',
        value: '左小翎，壳小杀',
        category: undefined,
      },
    ]);
  });

  test('resolves cover URLs from raw element attributes against sourceUrl', async () => {
    const doc = document.implementation.createHTMLDocument('wiki');
    doc.body.innerHTML = `
      <a class="cover" href="./brandnew/1090677/c1090677package.jpg">
        <img src="./thumb.jpg">
      </a>
    `;

    const infos = await extractFields(
      [
        {
          name: 'cover',
          source: dom('.cover'),
          read: cover(),
          clean: false,
          emit: { category: 'cover' },
        },
      ],
      {
        root: doc,
        site: 'getchu_game',
        sourceUrl: 'https://www.getchu.com/soft.phtml?id=1090677',
      }
    );

    expect(infos[0]?.value).toEqual({
      url: 'https://www.getchu.com/brandnew/1090677/c1090677package.jpg',
      dataUrl: 'data:https://www.getchu.com/brandnew/1090677/c1090677package.jpg',
    });
  });

  test('strips labels from Amazon book rich-product detail rows', async () => {
    const doc = document.implementation.createHTMLDocument('wiki');
    doc.body.innerHTML = `
      <div id="richProductInformation_feature_div">
        <ol class="a-carousel">
          <li>
            <div class="rpi-attribute-label"><span>ISBN-10</span></div>
            <div class="rpi-attribute-value"><span>4198643822</span></div>
          </li>
          <li>
            <div class="rpi-attribute-label"><span>ISBN-13</span></div>
            <div class="rpi-attribute-value"><span>978-4198643829</span></div>
          </li>
          <li>
            <div class="rpi-attribute-label"><span>出版社</span></div>
            <div class="rpi-attribute-value"><span>徳間書店</span></div>
          </li>
        </ol>
      </div>
    `;

    const infos = await extractFields(amazonJpBookSubject.itemList, {
      root: doc,
      site: 'amazon_jp_book',
    });

    expect(infos).toEqual(
      expect.arrayContaining([
        { name: 'ASIN', value: '4198643822', category: 'ASIN' },
        { name: 'ISBN', value: '978-4198643829', category: 'ISBN' },
        { name: '出版社', value: '徳間書店', category: undefined },
      ])
    );
  });

  test('passes character root to finalize', async () => {
    const doc = document.implementation.createHTMLDocument('wiki');
    doc.body.innerHTML = '<div class="item"><span class="name">Alice</span></div>';
    const root = doc.querySelector('.item')!;

    const infos = await getCharaData(
      {
        key: 'getchu_game_chara',
        siteKey: 'getchu_game',
        description: 'test',
        type: SubjectTypeId.game,
        itemSource: dom('.item').allItems(),
        itemList: [
          {
            name: '姓名',
            source: dom('.name'),
            kind: fieldKind.preservedText(),
            emit: { category: 'crt_name' },
          },
        ],
        finalize(items, context) {
          return [
            ...items,
            {
              name: 'root',
              value: context.kind === 'character' && context.root === root,
            },
          ];
        },
      },
      createWikiExtractContext(root)
    );

    expect(infos).toEqual([
      { name: '姓名', value: 'Alice', category: 'crt_name' },
      { name: 'root', value: true },
    ]);
  });
});
