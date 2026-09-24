import { vi, type Mocked, type MockedFunction } from 'vitest';
import { searchPersonCandidates } from '../sites/bangumi/personSearch';
import { checkPersonAndOpenEntry, PersonCreationRuntime } from './personCreation';

vi.mock('../sites/bangumi/personSearch', () => ({
  searchPersonCandidates: vi.fn(),
}));

const mockedSearch = searchPersonCandidates as MockedFunction<
  typeof searchPersonCandidates
>;

function createRuntime(): Mocked<PersonCreationRuntime> {
  return {
    bangumi: {
      host: 'https://bgm.tv',
    },
    notify: vi.fn(),
    openExistingPerson: vi.fn(),
    openNewPerson: vi.fn(),
  };
}

describe('checkPersonAndOpenEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('opens the existing person when bangumi already has a match', async () => {
    const runtime = createRuntime();
    mockedSearch.mockResolvedValue([
      { name: '折戸伸治', greyName: '折户伸治', url: '/person/1915' },
    ]);

    await checkPersonAndOpenEntry({ name: '折戸伸治' }, runtime);

    expect(mockedSearch).toHaveBeenCalledWith('折戸伸治');
    expect(runtime.openExistingPerson).toHaveBeenCalledWith('/person/1915');
    expect(runtime.openNewPerson).not.toHaveBeenCalled();
  });

  test('falls back to person/new when nothing matches', async () => {
    const runtime = createRuntime();
    mockedSearch.mockResolvedValue([]);

    await checkPersonAndOpenEntry({ name: '未登録の人' }, runtime);

    expect(runtime.openNewPerson).toHaveBeenCalledTimes(1);
    expect(runtime.openExistingPerson).not.toHaveBeenCalled();
  });

  test('skips the search entirely when the draft has no name', async () => {
    const runtime = createRuntime();

    await checkPersonAndOpenEntry({ name: '  ' }, runtime);

    expect(mockedSearch).not.toHaveBeenCalled();
    expect(runtime.openNewPerson).toHaveBeenCalledTimes(1);
  });

  test('notifies and rethrows when the search request fails', async () => {
    const runtime = createRuntime();
    mockedSearch.mockRejectedValue(new Error('network down'));

    await expect(
      checkPersonAndOpenEntry({ name: 'ZUN' }, runtime)
    ).rejects.toThrow('network down');

    expect(runtime.notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' })
    );
    expect(runtime.openNewPerson).not.toHaveBeenCalled();
    expect(runtime.openExistingPerson).not.toHaveBeenCalled();
  });
});
