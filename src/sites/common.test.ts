import { dealItemText, combineInfoList } from './common';

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
    console.log(a);
    const b = combineInfoList(
      [{ name: '游戏名', value: 'en', category: 'subject_title' }],
      [{ name: '游戏名', value: '中文', category: 'subject_title' }]
    );
    console.log(b);
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
    console.log(c);
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
    console.log(d);
  });
});
