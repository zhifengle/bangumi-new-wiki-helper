import { normalizeInfoText, normalizeTextByCategory } from './textNormalizer';

describe('core text normalizer', () => {
  test('normalizeInfoText removes label-like metadata via textPipe', () => {
    expect(normalizeInfoText('出版社: 少年画報社 (2019/7/8)', ['出版社'])).toBe(
      '少年画報社'
    );
  });

  test('normalizeTextByCategory preserves summary text while trimming metadata text', () => {
    expect(
      normalizeTextByCategory(
        '29 October 2019 – 00:01:22 UTC (9 months ago)',
        ''
      )
    ).toBe('29 October 2019 – 00:01:22 UTC');
    expect(
      normalizeTextByCategory(' 第一行\n第二行 ', 'subject_summary')
    ).toBe('第一行\n第二行');
  });
});
