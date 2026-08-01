// @vitest-environment jsdom
import { dlsiteTools } from './tools';

const globalAny = globalThis as Record<string, unknown>;
const originalLocation = globalAny.location;

function setLocation(url: string) {
  Object.defineProperty(globalAny, 'location', {
    configurable: true,
    value: new URL(url),
  });
}

describe('dlsite tools', () => {
  afterAll(() => {
    Object.defineProperty(globalAny, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  test('afterGetWikiData adds DLsite product page to 链接, not website', async () => {
    setLocation(
      'https://www.dlsite.com/maniax/work/=/product_id/RJ266116.html?locale=ja_JP'
    );

    const result = await dlsiteTools.hooks!.afterGetWikiData!([]);

    expect(result).toEqual([
      {
        name: '链接',
        value:
          'DLsite|https://www.dlsite.com/maniax/work/=/product_id/RJ266116.html',
        category: 'listItem',
      },
    ]);
  });

  test('afterGetWikiData converts extracted DLsite website values to 链接', async () => {
    setLocation('https://bgm.tv/new_subject/4');

    const result = await dlsiteTools.hooks!.afterGetWikiData!([
      {
        name: 'website',
        value: 'https://www.dlsite.com/maniax/work/=/product_id/RJ297120.html',
        category: 'website',
      },
    ]);

    expect(result).toEqual([
      {
        name: '链接',
        value:
          'DLsite|https://www.dlsite.com/maniax/work/=/product_id/RJ297120.html',
        category: 'listItem',
      },
    ]);
  });

  test('afterGetWikiData converts relative DLsite website values on DLsite pages', async () => {
    setLocation(
      'https://www.dlsite.com/maniax/work/=/product_id/RJ309886.html'
    );

    const result = await dlsiteTools.hooks!.afterGetWikiData!([
      {
        name: 'website',
        value: '/maniax/work/=/product_id/RJ309886.html',
        category: 'website',
      },
    ]);

    expect(result).toEqual([
      {
        name: '链接',
        value:
          'DLsite|https://www.dlsite.com/maniax/work/=/product_id/RJ309886.html',
        category: 'listItem',
      },
    ]);
  });
});
