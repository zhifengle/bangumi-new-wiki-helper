// @vitest-environment jsdom

import {
  dealSearchResults,
  InvalidBangumiSearchResponseError,
  UnauthenticatedBangumiSearchError,
} from './index';

describe('Bangumi search result parsing', () => {
  test('returns an empty result set for a valid empty search page', () => {
    const html = '<html><body><ul id="browserItemList"></ul></body></html>';

    expect(dealSearchResults(html)).toEqual([[], 1]);
  });

  test('rejects an error page that does not contain a result list', () => {
    const html = '<html><head><title>Forbidden</title></head><body>403</body></html>';

    expect(() => dealSearchResults(html)).toThrow(
      InvalidBangumiSearchResponseError
    );
  });

  test('rejects an unauthenticated search page even when it has results', () => {
    const html = `
      <html><body>
        <script>var CHOBITS_UID = 0, CHOBITS_USERNAME = '';</script>
        <div class="guest"><a href="/login" class="guest login">登录</a></div>
        <ul id="browserItemList">
          <li><div class="inner"><h3><a class="l" href="/subject/272902">クマ・トモ</a></h3></div></li>
        </ul>
      </body></html>
    `;

    expect(() => dealSearchResults(html)).toThrow(
      UnauthenticatedBangumiSearchError
    );
  });
});
