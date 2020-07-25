import { findModelByHost } from '.'
import { steamModel } from './steam'

test('find by host', () => {
  expect(findModelByHost('store.steampowered.com')).toEqual(steamModel)
  expect(findModelByHost('https://steamdb.info/')).toEqual(undefined)
})
