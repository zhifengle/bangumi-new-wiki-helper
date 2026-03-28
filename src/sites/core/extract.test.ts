/**
 * @jest-environment jsdom
 */
import { dealItemText, getWikiData } from './extract';
import { steamdbSubject } from '../steamdb/subject';
import { amazonJpBookSubject } from '../amazonJpBook/subject';

describe('core extract helpers', () => {
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
    const rawHtml = require('../../data/SteamDB.html');
    const jsdom = require('jsdom');
    const { JSDOM } = jsdom;
    const dom = new JSDOM(rawHtml);
    const infos = await getWikiData(steamdbSubject, dom.window.document);

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
    const rawHtml = require('../../data/amazon-book.html');
    const jsdom = require('jsdom');
    const { JSDOM } = jsdom;
    const dom = new JSDOM(rawHtml);
    const infos = await getWikiData(amazonJpBookSubject, dom.window.document);

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
    const rawHtml = require('../../data/amazon-book-cn.html');
    const jsdom = require('jsdom');
    const { JSDOM } = jsdom;
    const dom = new JSDOM(rawHtml);
    const infos = await getWikiData(amazonJpBookSubject, dom.window.document);

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
});
