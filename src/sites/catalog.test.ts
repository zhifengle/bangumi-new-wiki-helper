import {
  dealFuncByCategory,
  getCharacterModels,
  getSubjectHooks,
  findModelByHost,
} from './catalog';
import { getchuIntegration } from './getchu';
import { getchuChara } from './getchu/chara';
import { getchuSubject } from './getchu/subject';
import { getchuSubjectTools } from './getchu/tools';
import { steamSubject } from './steam/subject';

describe('sites catalog registry', () => {
  test('keeps per-site bundle structure inside each site directory', () => {
    expect(getchuIntegration.site).toBe(getchuSubject);
    expect(getchuIntegration.tools).toBe(getchuSubjectTools);
    expect(getchuIntegration.characters?.[0]?.model).toBe(getchuChara);
  });

  test('resolves configured filters through the public catalog api', () => {
    expect(dealFuncByCategory('dangdang_book', 'date')('出版时间：2024-01-02')).toBe(
      '2024-01-02'
    );
    expect(
      dealFuncByCategory('jd_book', 'subject_title')(
        '眼中星 2（知名作家蓝淋全新娱乐圈燃情励志追梦小说）'
      )
    ).toBe('眼中星 2');
  });

  test('finds subject definitions by host from the sites catalog', () => {
    expect(findModelByHost('store.steampowered.com')).toEqual([steamSubject]);
    expect(findModelByHost('https://steamdb.info/')).toEqual([]);
  });

  test('resolves getchu game to its character sources from the sites catalog', () => {
    expect(getCharacterModels('getchu_game')).toEqual([getchuChara]);
  });

  test('resolves site hooks through the public catalog api', () => {
    expect(getSubjectHooks(getchuSubject, 'beforeCreate')).toBe(
      getchuSubjectTools.hooks?.beforeCreate
    );
  });

  test('resolves configured title filters from the unified sites api', () => {
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
      )('幾日 (WANIMAGAZINE COMICS SPECIAL) (1)')
    ).toEqual('幾日 (WANIMAGAZINE COMICS SPECIAL) (1)');
  });
});

