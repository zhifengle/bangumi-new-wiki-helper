// @vitest-environment jsdom
import { getchuTools } from './tools';

describe('getchu tools', () => {
  test('deal title text', () => {
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

  test('get character info supports h4 chara-name headings', () => {
    document.body.innerHTML = `
      <table>
        <tr>
          <td>
            <dl>
              <dt>
                <h4 class="chara-name">新角色（しんきゃら） CV：测试声优</h4>
              </dt>
              <dd>
                <span style="font-weight: bold;">身長：160cm</span>
                开朗活泼的女主角
              </dd>
            </dl>
          </td>
        </tr>
      </table>
    `;

    const $target = document.querySelector('h4.chara-name');
    expect($target).not.toBeNull();
    expect(getchuTools.getCharacterInfo($target as Element)).toEqual(
      expect.arrayContaining([
        {
          name: '姓名',
          value: '新角色',
          category: 'crt_name',
        },
        {
          name: '日文名',
          value: '新角色',
        },
        {
          name: '纯假名',
          value: 'しんきゃら',
        },
        {
          name: 'CV',
          value: '测试声优',
        },
        {
          name: '身高',
          value: '160cm',
        },
        {
          name: '人物简介',
          value: '开朗活泼的女主角',
          category: 'crt_summary',
        },
      ])
    );
  });
});
