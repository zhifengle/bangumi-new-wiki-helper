import { dealFuncByCategory, identity, trimParenthesis } from './dealUtils';

test('test get func', () => {
  expect(dealFuncByCategory('steam_game', 'test')).toEqual(identity);
});

test('trim parenthesis', () => {
  expect(trimParenthesis('天籁音灵（当当独家签名海报+爱豆守护卡3张）')).toEqual(
    '天籁音灵'
  );
  expect(
    trimParenthesis(
      '眼中星 2（知名作家蓝淋全新娱乐圈燃情励志追梦小说，收入全新独家番外。）'
    )
  ).toEqual('眼中星 2');
});
