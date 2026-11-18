import { SubjectTypeId } from '../../interface/wiki';
import { getSubjectSearchKeyword, getTitleRetryQuery } from '../core/subjectTitle';
import { matchSubjectCandidates } from './index';

// Use the same date to exercise the title decision independently of release metadata.
const releaseDate = '2024-01-02';

describe('subject title searches with published titles', () => {
  test.each([
    // Makura's announcements use the compact hyphen spelling.
    { type: SubjectTypeId.game, name: 'サクラノ詩-櫻の森の上を舞う-', retry: 'サクラノ詩' },
    { type: SubjectTypeId.game, name: 'サクラノ詩 -櫻の森の上を舞う- 10th Anniversary edition' },
    // Steam listings keep the episode and version in their titles.
    { type: SubjectTypeId.game, name: '9-nine-:Episode 1' },
    { type: SubjectTypeId.game, name: 'Half-Life 2: Episode One' },
    { type: SubjectTypeId.game, name: 'X-Plane 12' },
    // The parentheses and imprint simulate alternate storefront formatting.
    { type: SubjectTypeId.book, name: '葬送のフリーレン（１１）' },
    { type: SubjectTypeId.book, name: 'SPY×FAMILY 1' },
    { type: SubjectTypeId.book, name: 'ソードアート・オンライン１アインクラッド' },
    {
      type: SubjectTypeId.book,
      name: 'Ｒｅ：ゼロから始める異世界生活　１（MF文庫J）',
      keyword: 'Ｒｅ：ゼロから始める異世界生活　１',
    },
  ])('uses the expected search terms for $name', ({ type, name, keyword, retry }) => {
    expect(getSubjectSearchKeyword(name, type)).toBe(keyword ?? name);
    expect(getTitleRetryQuery([], name)).toBe(retry);
  });

  test.each([
    ['サクラノ詩－櫻の森の上を舞う－', 'サクラノ詩-櫻の森の上を舞う-'],
    ['葬送のフリーレン　１', '葬送のフリーレン 1'],
    ['Ｒｅ：ゼロから始める異世界生活　１', 'Re:ゼロから始める異世界生活 1'],
  ])('matches %s exactly after normalizing character width', (name, candidateName) => {
    const candidate = { name: candidateName, url: '/subject/1', releaseDate };

    expect(matchSubjectCandidates([candidate], { name, releaseDate })).toEqual(candidate);
  });

  test.each([
    ['サクラノ詩-櫻の森の上を舞う-', 'サクラノ詩'],
    ['サクラノ詩-櫻の森の上を舞う-', 'サクラノ詩 -櫻の森の上を舞う-'],
  ])('presents %s and %s for review when the full titles differ', (name, candidateName) => {
    const candidate = { name: candidateName, url: '/subject/1', releaseDate };

    expect(matchSubjectCandidates([candidate], { name, releaseDate })).toEqual({
      candidates: [candidate],
    });
  });

  test.each([
    ['9-nine-:Episode 1', '9-nine-:Episode 2'],
    ['Summer Pockets REFLECTION BLUE', 'Summer Pockets'],
    ['GUILTY GEAR -STRIVE-', 'GUILTY GEAR'],
    ['Half-Life 2: Episode One', 'Half-Life 2'],
    ['葬送のフリーレン　１', '葬送のフリーレン １１'],
    ['Ｒｅ：ゼロから始める異世界生活　１', 'Ｒｅ：ゼロから始める異世界生活２'],
    ['ソードアート・オンライン１アインクラッド', 'ソードアート・オンライン Re:Aincrad 1'],
  ])('does not automatically match %s to the related release %s', (name, candidateName) => {
    const candidate = { name: candidateName, url: '/subject/1', releaseDate };
    const result = matchSubjectCandidates([candidate], { name, releaseDate });

    expect(result && 'url' in result).toBeFalsy();
  });
});
