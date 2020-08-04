import { getchuTools } from './getchu';

describe('test getchu function', function () {
  it('deal title text', function () {
    const dealTitle = getchuTools.dealTitle;
    expect(
      dealTitle(`はつゆきさくら 通常版

 （このタイトルの関連商品）`)
    ).toEqual('はつゆきさくら');
    expect(
      dealTitle('神様のような君へ 初回版＜早期予約キャンペーン特典＞ ')
    ).toEqual('神様のような君へ');
    expect(dealTitle('VenusBlood -HYPNO- Win10対応廉価版')).toEqual(
      'VenusBlood -HYPNO-'
    );
    expect(
      dealTitle(
        'Summer Pockets REFLECTION BLUE 豪華限定版＜早期予約キャンペーン特典付き＞ '
      )
    ).toEqual('Summer Pockets REFLECTION BLUE');
    expect(dealTitle('フルキスS 初回限定生産版 ')).toEqual('フルキスS');
    expect(
      dealTitle(
        '恋する乙女と守護の楯 Re:boot The“SHIELD-9” 完全生産限定版＜早期予約キャンペーン特典付き＞ '
      )
    ).toEqual('恋する乙女と守護の楯 Re:boot The“SHIELD-9”');
    expect(dealTitle('ママ×カノ フルセット特別限定版 ')).toEqual('ママ×カノ');
    expect(
      dealTitle('かけぬけ★青春スパーキング！      （このタイトルの関連商品）')
    ).toEqual('かけぬけ★青春スパーキング！');
    // Re：LieF ～親愛なるあなたへ～ Re：EditioN
  });
  test('get extra info', () => {
    expect(
      getchuTools.getExtraCharaInfo(
        '身長：144.0cm　 体重：36.0kg　　スリーサイズ：B73/ W52/ H75'
      )
    ).toEqual([
      {
        name: '身長',
        value: '144.0cm',
      },
      {
        name: '体重',
        value: '36.0kg',
      },
      {
        name: 'スリーサイズ',
        value: 'B73/ W52/ H75',
      },
    ]);
  });
});
