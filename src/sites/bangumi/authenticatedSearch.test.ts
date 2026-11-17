import { vi } from 'vitest';
import { SubjectTypeId } from '../../interface/wiki';
import { BangumiAccessTokenError } from './authenticatedSearch';
import { checkSubjectExit } from './index';

const api = 'https://api.bgm.tv/v0';
const host = 'https://chii.in';
const accessToken = 'test-token';

const options = { host, type: SubjectTypeId.game, accessToken };

afterEach(() => vi.unstubAllGlobals());

test('searches with a verified token and includes access-controlled results', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({ id: 1 }))
    .mockResolvedValueOnce(Response.json({
      data: [
        { id: 41, type: 4, name: 'Other title' },
        { id: 42, type: 4, name: 'Ｔｅｓｔ Game', nsfw: true },
      ],
    }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name: 'Test Game' }, options)).resolves.toMatchObject({
    url: '/subject/42',
  });
  expect(fetchMock).toHaveBeenNthCalledWith(1, `${api}/me`, expect.objectContaining({
    headers: expect.objectContaining({ Authorization: `Bearer ${accessToken}` }),
  }));
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    `${api}/search/subjects?limit=20`,
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: `Bearer ${accessToken}` }),
      body: JSON.stringify({ keyword: 'Test Game', sort: 'match', filter: { type: [4] } }),
    })
  );
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('stops duplicate checking if Bangumi rejects the token', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name: 'Test Game' }, options))
    .rejects.toBeInstanceOf(BangumiAccessTokenError);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('uses the existing search without sending the token when the API has no matching title', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({ id: 1 }))
    .mockResolvedValueOnce(Response.json({
      data: [{ id: 41, type: 4, name: 'Other title' }],
    }))
    .mockResolvedValueOnce(Response.json([
      { id: 42, type_id: 4, name: 'Test Game' },
    ]));
  vi.stubGlobal('fetch', fetchMock);

  await expect(checkSubjectExit({ name: 'Test Game' }, options)).resolves.toMatchObject({
    url: '/subject/42',
  });
  expect(fetchMock).toHaveBeenNthCalledWith(3, `${host}/json/search-game/Test%20Game`, {
    method: 'GET',
    body: null,
  });
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
