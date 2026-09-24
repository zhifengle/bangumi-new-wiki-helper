import { vi, type MockedFunction } from 'vitest';
import { fetchJson } from '../../utils/fetchData';
import { searchPersonCandidates } from './personSearch';

vi.mock('../../utils/fetchData', () => ({
  fetchJson: vi.fn(),
}));

const mockedFetchJson = fetchJson as MockedFunction<typeof fetchJson>;

describe('searchPersonCandidates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('posts the keyword to the v0 person search and maps hits to search results', async () => {
    mockedFetchJson.mockResolvedValue({
      data: [
        { id: 1915, name: '折戸伸治', name_cn: '折户伸治' },
        { id: 47922, name: '折戸科美' },
      ],
    });

    const results = await searchPersonCandidates('折戸伸治');

    expect(mockedFetchJson).toHaveBeenCalledWith(
      'https://api.bgm.tv/v0/search/persons?limit=10',
      {
        method: 'POST',
        data: JSON.stringify({ keyword: '折戸伸治' }),
        headers: { 'Content-Type': 'application/json' },
      }
    );
    expect(results).toEqual([
      { name: '折戸伸治', greyName: '折户伸治', url: '/person/1915' },
      { name: '折戸科美', greyName: '', url: '/person/47922' },
    ]);
  });

  test('returns no candidates for a blank name without calling the api', async () => {
    expect(await searchPersonCandidates('   ')).toEqual([]);
    expect(mockedFetchJson).not.toHaveBeenCalled();
  });

  test('treats a null or malformed response as no candidates', async () => {
    mockedFetchJson.mockResolvedValueOnce(null);
    expect(await searchPersonCandidates('ZUN')).toEqual([]);

    mockedFetchJson.mockResolvedValueOnce({ data: 'oops' });
    expect(await searchPersonCandidates('ZUN')).toEqual([]);
  });
});
