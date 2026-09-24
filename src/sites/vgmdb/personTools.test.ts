import {
  cleanRedirectUrl,
  formatBangumiBirthday,
  parseJapaneseName,
  resolveOrgRole,
  toBangumiRomaji,
} from './personTools';

describe('vgmdb person tools', () => {
  test('formatBangumiBirthday writes only the parts VGMdb knows', () => {
    expect(formatBangumiBirthday('Jul 30, 1973')).toBe('1973年7月30日');
    expect(formatBangumiBirthday('Mar 1977')).toBe('1977年3月');
    expect(formatBangumiBirthday('1977')).toBe('1977年');
    expect(formatBangumiBirthday('Mar 18')).toBe('3月18日');
    expect(formatBangumiBirthday('1977-03-18')).toBe('1977年3月18日');
    expect(formatBangumiBirthday('unknown')).toBe('unknown');
    expect(formatBangumiBirthday('')).toBe('');
  });

  test('parseJapaneseName splits kanji and kana and drops spaces from the name', () => {
    expect(parseJapaneseName('折戸 伸治 (おりと しんじ)')).toEqual({
      name: '折戸伸治',
      kana: 'おりと しんじ',
    });
    expect(parseJapaneseName('太田順也')).toEqual({ name: '太田順也', kana: '' });
    expect(parseJapaneseName(' ')).toEqual({ name: '', kana: '' });
  });

  test('toBangumiRomaji swaps two-word display names into family-name-first order', () => {
    expect(toBangumiRomaji('Shinji Orito', true)).toBe('Orito Shinji');
    expect(toBangumiRomaji('Shinji Orito', false)).toBe('Shinji Orito');
    expect(toBangumiRomaji('Jun Maeda Junior', true)).toBe('Jun Maeda Junior');
    expect(toBangumiRomaji('ZUN', true)).toBe('ZUN');
  });

  test('resolveOrgRole maps VGMdb organisation types to the person/new role select', () => {
    expect(resolveOrgRole('Label / Imprint')).toBe(2);
    expect(resolveOrgRole('Game Developer')).toBe(2);
    expect(resolveOrgRole('Doujin Circle')).toBe(3);
    expect(resolveOrgRole('Band')).toBe(3);
    expect(resolveOrgRole('Something Else')).toBe(2);
    expect(resolveOrgRole('')).toBe(2);
  });

  test('cleanRedirectUrl strips the VGMdb redirect prefix and restores a scheme', () => {
    expect(
      cleanRedirectUrl('/redirect/301/https://www16.big.or.jp/~zun/')
    ).toBe('https://www16.big.or.jp/~zun/');
    expect(
      cleanRedirectUrl('https://vgmdb.net/redirect/49861/https://en.wikipedia.org/wiki/Shinji_Orito')
    ).toBe('https://en.wikipedia.org/wiki/Shinji_Orito');
    expect(cleanRedirectUrl('/redirect/19730/web.archive.org/web/*/unison.beta.or.jp/')).toBe(
      'https://web.archive.org/web/*/unison.beta.or.jp/'
    );
    expect(cleanRedirectUrl('https://example.com/page')).toBe('https://example.com/page');
  });
});
