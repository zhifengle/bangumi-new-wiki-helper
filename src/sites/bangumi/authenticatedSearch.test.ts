import { vi } from 'vitest';
import { SubjectTypeId } from '../../interface/wiki';
import { BangumiAccessTokenError, browseSubjectsByDate } from './authenticatedSearch';
import { checkSubjectExit } from './index';

const api = 'https://api.bgm.tv/v0';
const host = 'https://chii.in';
const accessToken = 'test-token';

const options = { host, type: SubjectTypeId.game, accessToken, useLegacyJsonSearch: false };

afterEach(() => vi.unstubAllGlobals());

test('sends the token directly to search and includes access-controlled results', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({
      data: [
        { id: 41, type: 4, name: 'Other title' },
        { id: 42, type: 4, name: 'Ｔｅｓｔ Game', nsfw: true },
      ],
    }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name: 'Test Game' }, options)).resolves.toMatchObject({
    candidates: [{ url: '/subject/42' }],
  });
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
    `${api}/search/subjects?limit=20`,
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: `Bearer ${accessToken}` }),
      body: JSON.stringify({ keyword: 'Test Game', sort: 'match', filter: { type: [4] } }),
    })
  );
});

test.each([
  '西園家のかくしゴト- The Secret Revealed by the Lens -',
  '西園家のかくしゴト-The Secret Revealed by the Lens-',
])('keeps the main-title API hit for %s', async (name) => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({
      data: [
        { id: 667682, type: 4, name: '西園家のかくしゴト', date: '2026-10-30' },
        { id: 412884, type: 4, name: '西園美魚密室殺人事件？', date: '2014-01-29' },
      ],
    }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({
    name,
    releaseDate: '2026-10-30',
  }, { ...options, fallbackToWebSearch: true })).resolves.toMatchObject({
    candidates: [{ url: '/subject/667682' }],
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('retries the legacy main title before using a configured token', async () => {
  const name = '西園家のかくしゴト-The Secret Revealed by the Lens-';
  const nearTitle = '西園家のかくしゴト- The Secret Revealed by the Camera -';
  const shortTitle = { id: 667682, type_id: 4, name: '西園家のかくしゴト' };
  const nearTitleHit = { id: 42, type_id: 4, name: nearTitle };
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json([nearTitleHit]))
    .mockResolvedValueOnce(Response.json([shortTitle]));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit(
    { name },
    { host, type: SubjectTypeId.game, accessToken }
  )).resolves.toMatchObject({
    candidates: [{ url: '/subject/667682' }, { url: '/subject/42' }],
  });
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    `${host}/json/search-game/${encodeURIComponent('西園家のかくしゴト')}`,
    { method: 'GET', body: null }
  );
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test.each([
  { name: 'Half-Life 2〜Episode One～', mainTitle: 'Half-Life 2' },
  { name: 'Half-Life 2 -Episode-One-', mainTitle: 'Half-Life 2' },
  { name: 'サクラノ詩２-Episode-One-', mainTitle: 'サクラノ詩2' },
  { name: 'Happy-Smile-終わり-', mainTitle: 'Happy-Smile' },
])('retries $name with its main title', async ({ name, mainTitle }) => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({
      data: [{ id: 1, type: 4, name: 'Half-Life 3' }],
    }))
    .mockResolvedValueOnce(Response.json({
      data: [{ id: 2, type: 4, name: mainTitle, date: '2004-11-16' }],
    }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({
    name,
    releaseDate: '2004-11-16',
  }, options)).resolves.toMatchObject({
    candidates: expect.arrayContaining([expect.objectContaining({ url: '/subject/2' })]),
  });
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    `${api}/search/subjects?limit=20`,
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: `Bearer ${accessToken}` }),
      body: JSON.stringify({
        keyword: mainTitle,
        sort: 'match',
        filter: { type: [4] },
      }),
    })
  );
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test.each([
  'Half-Life-',
  'Half-Life 2-Episode-One-',
  'サクラノ詩-櫻-森-',
])('keeps the full query when %s has no clear subtitle boundary', async (name) => {
  const fetchMock = vi.fn()
    .mockImplementation(async () => Response.json({ data: [] }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name }, options))
    .resolves.toBeUndefined();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('stops duplicate checking if Bangumi rejects the token', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name: 'Test Game' }, options))
    .rejects.toBeInstanceOf(BangumiAccessTokenError);
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
    `${api}/search/subjects?limit=20`, expect.objectContaining({ method: 'POST' })
  );
});

test('does not use site search when the authenticated API has no matching title after retrying', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({
      data: [{ id: 41, type: 4, name: 'Other title' }],
    }))
    .mockResolvedValueOnce(Response.json({ data: [] }))
    .mockResolvedValueOnce(Response.json([
      { id: 42, type_id: 4, name: 'Test Game - Subtitle -' },
    ]));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit(
    { name: 'Test Game - Subtitle -' },
    { ...options, fallbackToWebSearch: true }
  )).resolves.toBeUndefined();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('finishes paging the full title before deciding whether to retry with the main title', async () => {
  const name = 'Test Game - Subtitle -';
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({
      total: 22,
      limit: 20,
      offset: 0,
      data: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, type: 4, name: 'Unrelated' })),
    }))
    .mockResolvedValueOnce(Response.json({
      total: 22,
      limit: 20,
      offset: 20,
      data: [{ id: 21, type: 4, name: 'Unrelated' }, { id: 22, type: 4, name }],
    }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name }, options)).resolves.toMatchObject({
    candidates: [{ url: '/subject/22' }],
  });
  expect(fetchMock).toHaveBeenNthCalledWith(
    2, `${api}/search/subjects?limit=20&offset=20`, expect.objectContaining({ method: 'POST' })
  );
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('looks on the next main-title page if the full-title search misses', async () => {
  const name = 'Test Game - Subtitle -';
  const mainTitle = 'Test Game';
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({ data: [] }))
    .mockResolvedValueOnce(Response.json({
      total: 22,
      limit: 20,
      offset: 0,
      data: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, type: 4, name: 'Unrelated' })),
    }))
    .mockResolvedValueOnce(Response.json({
      total: 22,
      limit: 20,
      offset: 20,
      data: [{ id: 21, type: 4, name: 'Unrelated' }, { id: 22, type: 4, name: mainTitle }],
    }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name }, options)).resolves.toMatchObject({
    candidates: [{ url: '/subject/22' }],
  });
  expect(fetchMock).toHaveBeenNthCalledWith(
    3,
    `${api}/search/subjects?limit=20&offset=20`,
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ keyword: mainTitle, sort: 'match', filter: { type: [4] } }),
    })
  );
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

test('finds a title even when the source release date differs', async () => {
  const name = 'Test Game';
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({ data: [{ id: 1, type: 4, name, date: '2025-12-31' }] }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name, releaseDate: '2026-01-01' }, options))
    .resolves.toMatchObject({ candidates: [{ url: '/subject/1' }] });
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${api}/search/subjects?limit=20`, expect.objectContaining({
    body: JSON.stringify({ keyword: name, sort: 'match', filter: { type: [4] } }),
  }));
});

test('can browse a release month directly and follows the reported page size', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({
      total: 2, limit: 1, offset: 0,
      data: [{ id: 1, type: 4, name: 'First Game', date: '2026-12-25' }],
    }))
    .mockResolvedValueOnce(Response.json({
      total: 2, limit: 1, offset: 1,
      data: [{ id: 712348, type: 4, name: 'Second Game', date: '2026-12-24' }],
    }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(browseSubjectsByDate(SubjectTypeId.game, { year: 2026, month: 12 }, accessToken))
    .resolves.toMatchObject([
      { url: '/subject/1', releaseDate: '2026-12-25' },
      { url: '/subject/712348', releaseDate: '2026-12-24' },
    ]);
  const url = `${api}/subjects?type=4&year=2026&month=12&sort=date&limit=50`;
  const request = expect.objectContaining({
    method: 'GET',
    headers: expect.objectContaining({ Authorization: `Bearer ${accessToken}` }),
  });
  expect(fetchMock).toHaveBeenNthCalledWith(1, `${url}&offset=0`, request);
  expect(fetchMock).toHaveBeenNthCalledWith(2, `${url}&offset=1`, request);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('still matches a book by ISBN before searching by name with a token', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json([{ id: 42, type_id: 1, name: 'Test Book' }]))
    .mockResolvedValueOnce(Response.json({
      infobox: [{ key: 'ISBN', value: '978-4757556973' }],
    }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit(
    { name: 'Test Book', isbn: '978-4757556973' },
    { ...options, type: SubjectTypeId.book }
  )).resolves.toMatchObject({ url: '/subject/42' });
  expect(fetchMock).toHaveBeenNthCalledWith(
    1,
    `${host}/json/search-book/9784757556973`,
    { method: 'GET', body: null }
  );
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    `${api}/subjects/42`,
    expect.objectContaining({ method: 'GET' })
  );
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('verifies every ISBN search candidate instead of trusting the result count', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json([
      { id: 41, type_id: 1, name: 'Wrong Edition' },
      { id: 42, type_id: 1, name: 'Test Book' },
    ]))
    .mockResolvedValueOnce(Response.json({
      infobox: [{ key: 'ISBN', value: '978-4-0000-0000-0' }],
    }))
    .mockResolvedValueOnce(Response.json({
      infobox: [{ key: 'ISBN-13', value: '978-4757556973' }],
    }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit(
    { name: 'Test Book', isbn: '978-4757556973' },
    { ...options, type: SubjectTypeId.book }
  )).resolves.toMatchObject({ url: '/subject/42' });
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
