import { findModelByHost, getCharaModel } from '.';
import { getchuGameCharaModel } from './getchuGameChara';
import { steamModel } from './steam';

test('find by host', () => {
  expect(findModelByHost('store.steampowered.com')).toEqual([steamModel]);
  expect(findModelByHost('https://steamdb.info/')).toEqual([]);
});

test('getchu game resolves to the getchu character model', () => {
  expect(getCharaModel('getchu_game')).toEqual(getchuGameCharaModel);
});
