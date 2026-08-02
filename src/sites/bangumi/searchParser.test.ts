// @vitest-environment jsdom

import { dealSearchResults } from './index';

describe('Bangumi search result parsing', () => {
  test('returns an empty result set for a valid empty search page', () => {
    const html = '<html><body><ul id="browserItemList"></ul></body></html>';

    expect(dealSearchResults(html)).toEqual([[], 1]);
  });

  test('rejects an error page that does not contain a result list', () => {
    const html = '<html><head><title>Forbidden</title></head><body>403</body></html>';

    expect(() => dealSearchResults(html)).toThrow(
      'Invalid Bangumi search response: result list not found'
    );
  });
});
