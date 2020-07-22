import { dealFuncByCategory, identity } from './dealUtils'

test('test get func', () => {
  expect(dealFuncByCategory('steam_game', 'test')).toEqual(identity)
})
