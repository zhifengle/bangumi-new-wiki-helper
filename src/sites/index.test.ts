import { dealFuncByCategory, identity, trimParenthesis } from './index';

describe('sites utils', () => {
  test('filter', () => {
    expect(
      dealFuncByCategory(
        'getchu_game',
        'subject_title'
      )('神様のような君へ 初回版＜早期予約キャンペーン特典＞ ')
    ).toEqual('神様のような君へ');
    expect(
      dealFuncByCategory(
        'amazon_jp_book',
        'subject_title'
      )(`幾日 (WANIMAGAZINE COMICS SPECIAL) (1)`)
    ).toEqual('幾日 (WANIMAGAZINE COMICS SPECIAL) (1)');
  });
  test('trim parenthesis', () => {
    expect(
      trimParenthesis('天籁音灵（当当独家签名海报+爱豆守护卡3张）')
    ).toEqual('天籁音灵');
    expect(
      trimParenthesis(
        '眼中星 2（知名作家蓝淋全新娱乐圈燃情励志追梦小说，收入全新独家番外。）'
      )
    ).toEqual('眼中星 2');
  });
});
