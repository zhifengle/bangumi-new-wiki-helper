import { dealItemText, combineInfoList, getWikiData } from './common';
import { getchuGameModel } from '../models/getchuGame';
import { steamdbModel } from '../models/steamdb';

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
  });
});

describe('test get wiki data', () => {
  test('get wiki data', async () => {
    // getWikiData(getchuGameModel)
    const rawHtml = require('../data/SteamDB.html');
    const jsdom = require('jsdom');
    const { JSDOM } = jsdom;
    const dom = new JSDOM(rawHtml);
    const infos = await getWikiData(steamdbModel, dom.window.document);
    console.log(infos);
  });
});
