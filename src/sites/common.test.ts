import { dealItemText, combineInfoList, getWikiData } from './common';
import { getchuGameModel } from '../models/getchuGame';
import { steamdbModel } from '../models/steamdb';
import { amazonSubjectModel } from '../models/amazonJpBook';

describe('test common', () => {
  test('deal text', () => {
    expect(dealItemText('言語: 日本語', '', ['言語'])).toEqual('日本語');
    expect(dealItemText('言語： 日本語', '', ['言語'])).toEqual('日本語');
    expect(dealItemText('言語 日本語', '', ['言語'])).toEqual('日本語');
    expect(dealItemText('言語:       日本語', '', ['言語'])).toEqual('日本語');
    expect(
      dealItemText('出版社: 少年画報社 (2019/7/8)', '', ['出版社'])
    ).toEqual('少年画報社');
    // TODO: 去掉 ページ
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
  test('combine info list', () => {
    const a = combineInfoList(
      [
        {
          name: 'website',
          value: '123',
        },
        {
          name: '别名',
          value: 'b1',
        },
        {
          name: '平台',
          value: 'PC',
        },
        {
          name: '平台',
          value: 'PC3',
        },
      ],
      [
        {
          name: '平台',
          value: 'PC',
        },
        {
          name: '别名',
          value: 'b2',
        },
        {
          name: '名称',
          value: 'test',
        },
      ]
    );
    expect(a).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'website',
          value: '123',
        }),
        expect.objectContaining({
          name: '别名',
          value: 'b1',
        }),
        expect.objectContaining({
          name: '别名',
          value: 'b2',
        }),
        expect.objectContaining({
          name: '平台',
          value: 'PC',
        }),
        expect.objectContaining({
          name: '平台',
          value: 'PC3',
        }),
        expect.objectContaining({
          name: '名称',
          value: 'test',
        }),
      ])
    );
    const b = combineInfoList(
      [{ name: '游戏名', value: 'en', category: 'subject_title' }],
      [{ name: '游戏名', value: '中文', category: 'subject_title' }]
    );
    expect(b).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '游戏名',
          value: 'en',
          category: 'subject_title',
        }),
        expect.objectContaining({
          name: '中文名',
          value: '中文',
        }),
      ])
    );
    const c = combineInfoList(
      [
        {
          name: '游戏名',
          value: '蒼の彼方のフォーリズム',
          category: 'subject_title',
        },
      ],
      [{ name: '游戏名', value: '中文', category: 'subject_title' }]
    );
    expect(c).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '游戏名',
          value: '蒼の彼方のフォーリズム',
          category: 'subject_title',
        }),
        expect.objectContaining({
          name: '中文名',
          value: '中文',
        }),
      ])
    );
    const d = combineInfoList(
      [
        {
          name: '游戏名',
          value: '蒼の彼方のフォーリズム',
          category: 'subject_title',
        },
      ],
      [{ name: '游戏名', value: 'en', category: 'subject_title' }]
    );
    // 日日 ----> title + 别名
    expect(d).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '游戏名',
          value: '蒼の彼方のフォーリズム',
          category: 'subject_title',
        }),
        expect.objectContaining({
          name: '别名',
          value: 'en',
        }),
      ])
    );
    const e = combineInfoList(
      [
        {
          name: '游戏名',
          value: '蒼の彼方のフォーリズム',
          category: 'subject_title',
        },
      ],
      [{ name: '游戏名', value: '蒼の彼方のフォーリズム', category: 'alias' }]
    );
    expect(e).toEqual([
      {
        name: '游戏名',
        value: '蒼の彼方のフォーリズム',
        category: 'subject_title',
      },
    ]);
    const f = combineInfoList(
      [
        {
          name: '游戏名',
          value: '蒼の彼方のフォーリズム',
          category: 'subject_title',
        },
      ],
      [{ name: '游戏名', value: '蒼の彼方のフォーリズム' }],
      {
        originNames: ['游戏名'],
      }
    );
    expect(f).toEqual([
      {
        name: '游戏名',
        value: '蒼の彼方のフォーリズム',
        category: 'subject_title',
      },
    ]);
  });
  test('combine info list when empty', () => {
    expect(
      combineInfoList([{ name: '游戏名', value: '蒼の彼方のフォーリズム' }], [])
    ).toEqual([{ name: '游戏名', value: '蒼の彼方のフォーリズム' }]);
    expect(
      combineInfoList([], [{ name: '游戏名', value: '蒼の彼方のフォーリズム' }])
    ).toEqual([{ name: '游戏名', value: '蒼の彼方のフォーリズム' }]);
  });
});

describe('test get wiki data', () => {
  test('get steam db wiki data', async () => {
    // getWikiData(getchuGameModel)
    const rawHtml = require('../data/SteamDB.html');
    const jsdom = require('jsdom');
    const { JSDOM } = jsdom;
    const dom = new JSDOM(rawHtml);
    const infos = await getWikiData(steamdbModel, dom.window.document);
    expect(infos).toHaveLength(10);
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
  test('get amazon book wiki data', async () => {
    // getWikiData(getchuGameModel)
    const rawHtml = require('../data/amazon-book.html');
    const jsdom = require('jsdom');
    const { JSDOM } = jsdom;
    const dom = new JSDOM(rawHtml);
    const infos = await getWikiData(amazonSubjectModel, dom.window.document);
    expect(infos).toHaveLength(9);
    expect(infos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '名称',
          value: '大蜘蛛ちゃんフラッシュ・バック(2)',
          category: 'subject_title',
        }),
        expect.objectContaining({
          name: 'ISBN',
          value: '978-4065111819',
          category: 'ISBN',
        }),
        expect.objectContaining({
          name: '发售日',
          value: '2018-04-23',
          category: 'date',
        }),
        expect.objectContaining({
          name: '作者',
          value: '植芝理一',
          category: 'creator',
        }),
        expect.objectContaining({
          name: '出版社',
          value: '講談社',
          category: undefined,
        }),
        expect.objectContaining({
          name: '页数',
          value: '192',
          category: undefined,
        }),
        expect.objectContaining({
          name: '价格',
          value: '￥660',
          category: undefined,
        }),
        expect.objectContaining({
          name: 'ASIN',
          value: '4065111811',
          category: 'ASIN',
        }),
      ])
    );
  });
  test('get amazon book wiki cn data', async () => {
    // getWikiData(getchuGameModel)
    const rawHtml = require('../data/amazon-book-cn.html');
    const jsdom = require('jsdom');
    const { JSDOM } = jsdom;
    const dom = new JSDOM(rawHtml);
    const infos = await getWikiData(amazonSubjectModel, dom.window.document);
    // 内容简介在 iframe 里面
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
          name: '价格',
          value: 'JP¥1,760',
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
});
