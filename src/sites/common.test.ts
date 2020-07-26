import { dealItemText } from './common';

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
});
