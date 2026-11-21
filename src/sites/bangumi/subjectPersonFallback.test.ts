// @vitest-environment jsdom
import { vi } from 'vitest';
import { SubjectTypeId } from '../../interface/wiki';
import { HttpStatusError } from '../../utils/fetchData';
import { getQueryInfo } from '../core/search';
import { checkSubjectExit } from './index';

vi.mock('../../utils/async/sleep', () => ({ sleep: vi.fn().mockResolvedValue(undefined) }));

const host = 'https://bgm.tv';
const api = 'https://api.bgm.tv/v0';
const options = { host, type: SubjectTypeId.game };
const personFallback = { ...options, fallbackToPersonWorks: true };
const name = '鈴菜ルートしか存在しない世界に迷い込みました ～ 無限鈴菜に愛される俺の話 ～';
const canonicalTitle = '鈴菜ルートしか存在しない世界に迷い込みました ～無限鈴菜に愛される俺の話～';
const game = getQueryInfo([
  { name: '游戏名', category: 'subject_title', value: name },
  { name: '原画', value: 'CARNELIAN、另一位原画' },
  { name: '剧本', value: '作者甲' },
]);

afterEach(() => vi.unstubAllGlobals());

test('starts with legacy JSON and does not supplement by person or web by default', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(null));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ ...game, name: 'Test Game' }, options)).resolves.toBeUndefined();
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
    `${host}/json/search-game/Test%20Game`, expect.objectContaining({ method: 'GET' })
  );
});

test('uses anonymous v0 when legacy title search is disabled', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ data: [] }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name: 'Test Game' }, {
    ...options,
    useLegacyJsonSearch: false,
  })).resolves.toBeUndefined();
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
    `${api}/search/subjects?limit=20`, expect.objectContaining({ method: 'POST' })
  );
  expect(new Headers(fetchMock.mock.calls[0][1].headers).has('Authorization')).toBe(false);
});

test('never uses the disabled web fallback when legacy JSON raises an HTTP error', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 503 }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name: 'Test Game' }, options)).rejects.toBeInstanceOf(HttpStatusError);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test.each([undefined, 'test-token'])('stops at an equivalent legacy title with token %s', async (accessToken) => {
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json([
    { id: 712348, type_id: 4, name: canonicalTitle },
  ]));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit(game, { ...personFallback, fallbackToWebSearch: true, accessToken }))
    .resolves.toMatchObject({ candidates: [{ url: '/subject/712348' }] });
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
    `${host}/json/search-game/${encodeURIComponent(name)}`, { method: 'GET', body: null }
  );
});

test('fills in a legacy miss from authenticated v0 and stops before web and person works', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json([{ id: 42, type_id: 4, name: 'Test Game (Preview)' }]))
    .mockResolvedValueOnce(Response.json({ data: [{ id: 42, type: 4, name: 'Test Game', date: '2026-12-24' }] }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ ...game, name: 'Test Game', releaseDate: '2026-12-24' }, {
    ...personFallback, accessToken: 'test-token', fallbackToWebSearch: true,
  })).resolves.toMatchObject({ url: '/subject/42', name: 'Test Game' });
  expect(fetchMock).toHaveBeenNthCalledWith(1, `${host}/json/search-game/Test%20Game`, { method: 'GET', body: null });
  expect(fetchMock).toHaveBeenNthCalledWith(2, `${api}/search/subjects?limit=20`, expect.objectContaining({
    method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
  }));
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('uses the available v0 fallback when the initial legacy request fails', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(Response.json({ data: [{ id: 42, type: 4, name: 'Test Game' }] }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name: 'Test Game' }, { ...options, accessToken: 'test-token' }))
    .resolves.toMatchObject({ url: '/subject/42' });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('uses one enabled web page after a legacy miss and stops when its title matches', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json(null))
    .mockResolvedValueOnce(new Response(`
      <ul id="browserItemList"><li><div class="inner">
        <h3><a class="l" href="/subject/42">Test Game</a></h3>
      </div></li></ul>
    `));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ ...game, name: 'Test Game' }, { ...personFallback, fallbackToWebSearch: true }))
    .resolves.toMatchObject({ url: '/subject/42' });
  expect(fetchMock).toHaveBeenNthCalledWith(2, `${host}/subject_search/Test%20Game?cat=4`, { method: 'GET', body: null });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('uses the single credited writer after the enabled web search also misses', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json(null))
    .mockResolvedValueOnce(Response.json(null))
    .mockResolvedValueOnce(new Response('<ul id="browserItemList"></ul>'))
    .mockResolvedValueOnce(Response.json({ data: [{ id: 7, name: '作者甲' }] }))
    .mockResolvedValueOnce(Response.json([{ id: 712348, type: 4, name: canonicalTitle, staff: '剧本' }]));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit(game, { ...personFallback, fallbackToWebSearch: true }))
    .resolves.toMatchObject({ candidates: [{ url: '/subject/712348', personCredit: { name: '作者甲', staff: '剧本' } }] });
  expect(fetchMock).toHaveBeenNthCalledWith(3, `${host}/subject_search/${encodeURIComponent(name)}?cat=4`, { method: 'GET', body: null });
  expect(fetchMock).toHaveBeenNthCalledWith(4, `${api}/search/persons?limit=10`, expect.objectContaining({
    body: JSON.stringify({ keyword: '作者甲' }),
  }));
  expect(fetchMock).toHaveBeenNthCalledWith(5, `${api}/persons/7/subjects`, expect.objectContaining({ method: 'GET' }));
  expect(fetchMock).toHaveBeenCalledTimes(5);
});

test('only sends matching works to confirmation after the legacy and v0 title paths miss', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json(null))
    .mockResolvedValueOnce(Response.json(null))
    .mockResolvedValueOnce(Response.json({ data: [{ id: 712348, type: 4, name: `${name} DVD版` }] }))
    .mockResolvedValueOnce(Response.json({ data: [] }))
    .mockResolvedValueOnce(Response.json({ data: [{ id: 3363, name: 'CARNELIAN' }] }))
    .mockResolvedValueOnce(Response.json([
      { id: 712348, type: 4, name: canonicalTitle, staff: '原画' },
      { id: 712348, type: 4, name: canonicalTitle, staff: '原画' },
      { id: 2, type: 1, name: canonicalTitle },
      { id: 3, type: 4, name: `${canonicalTitle} DVD版` },
      { id: 4, type: 4, name: '鈴菜ルートしか存在しない世界に迷い込みました ～別の話～' },
    ]));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ ...game, creators: [{ role: '原画', name: 'CARNELIAN' }] }, {
    ...personFallback,
    accessToken: 'test-token',
  })).resolves.toEqual({ candidates: [expect.objectContaining({
    name: canonicalTitle,
    url: '/subject/712348',
    personCredit: { name: 'CARNELIAN', staff: '原画' },
  })] });
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    `${host}/json/search-game/${encodeURIComponent(name)}`,
    `${host}/json/search-game/${encodeURIComponent('鈴菜ルートしか存在しない世界に迷い込みました')}`,
    `${api}/search/subjects?limit=20`,
    `${api}/search/subjects?limit=20`,
    `${api}/search/persons?limit=10`,
    `${api}/persons/3363/subjects`,
  ]);
});

test('uses a known author ID directly and leaves similarly named book volumes out', async () => {
  const title = '空の境界 上';
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json(null))
    .mockResolvedValueOnce(Response.json([
      { id: 1, type: 1, name: title, staff: '作者' },
      { id: 2, type: 1, name: '空の境界 下', staff: '作者' },
    ]));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name: title, creators: [{ role: '作者', name: '奈須きのこ', bangumiPersonId: 42 }] }, {
    ...personFallback,
    type: SubjectTypeId.book,
  })).resolves.toEqual({ candidates: [expect.objectContaining({ url: '/subject/1' })] });
  expect(fetchMock).toHaveBeenNthCalledWith(2, `${api}/persons/42/subjects`, expect.objectContaining({ method: 'GET' }));
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('does not expand works for ambiguous exact names or retry other creators', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json(null))
    .mockResolvedValueOnce(Response.json({ data: [
      { id: 1, name: '作者甲' }, { id: 2, name: 'Author A', name_cn: '作者甲' },
    ] }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name: 'Test Game', creators: [
    { role: '原画', name: '作者甲' }, { role: '剧本', name: '作者乙' },
  ] }, personFallback)).resolves.toBeUndefined();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
