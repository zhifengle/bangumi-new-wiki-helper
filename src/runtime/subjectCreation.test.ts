import { vi, type Mocked, type MockedFunction } from 'vitest';
import { SubjectTypeId } from '../interface/wiki';
import {
  checkSubjectAndOpenEntry,
  createNewSubjectEntry,
  SubjectCreationRuntime,
} from './subjectCreation';
import { checkSubjectExit } from '../sites/bangumi';
import { getSubjectId } from '../sites/bangumi/common';

vi.mock('../sites/bangumi', () => ({
  checkSubjectExit: vi.fn(),
}));

vi.mock('../sites/bangumi/common', () => ({
  getSubjectId: vi.fn(),
}));

const mockedCheckSubjectExit = checkSubjectExit as MockedFunction<typeof checkSubjectExit>;
const mockedGetSubjectId = getSubjectId as MockedFunction<typeof getSubjectId>;

function createRuntime(): Mocked<SubjectCreationRuntime> {
  return {
    bgmHost: 'https://bgm.tv',
    notify: vi.fn(),
    updateAuxData: vi.fn(),
    saveSubjectId: vi.fn(),
    openExistingSubject: vi.fn(),
    openNewSubject: vi.fn(),
  };
}

describe('createNewSubjectEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('opens new subject page directly when no auxSite', async () => {
    const runtime = createRuntime();

    await createNewSubjectEntry({ type: SubjectTypeId.game }, runtime);

    expect(runtime.updateAuxData).not.toHaveBeenCalled();
    expect(runtime.openNewSubject).toHaveBeenCalledWith(SubjectTypeId.game);
  });

  test('updates aux data before opening new subject page when auxSite is provided', async () => {
    const runtime = createRuntime();
    const auxSite = { url: 'https://store.steampowered.com/app/123' };

    await createNewSubjectEntry({ type: SubjectTypeId.game, auxSite }, runtime);

    expect(runtime.updateAuxData).toHaveBeenCalledWith(auxSite);
    expect(runtime.openNewSubject).toHaveBeenCalledWith(SubjectTypeId.game);
  });
});

describe('checkSubjectAndOpenEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('opens an existing subject when bangumi search finds a match', async () => {
    const runtime = createRuntime();
    mockedCheckSubjectExit.mockResolvedValue({
      kind: 'subject',
      name: '测试条目',
      url: '/subject/42',
    });
    mockedGetSubjectId.mockReturnValue('42');

    await checkSubjectAndOpenEntry(
      { type: SubjectTypeId.game, subjectInfo: { name: '测试条目' } },
      runtime
    );

    expect(mockedCheckSubjectExit).toHaveBeenCalledWith(
      { name: '测试条目' },
      'https://bgm.tv',
      SubjectTypeId.game,
      undefined
    );
    expect(runtime.saveSubjectId).toHaveBeenCalledWith('42');
    expect(runtime.openExistingSubject).toHaveBeenCalledWith('/subject/42');
    expect(runtime.openNewSubject).not.toHaveBeenCalled();
  });

  test('shows searching notification then dismisses it on success', async () => {
    const runtime = createRuntime();
    mockedCheckSubjectExit.mockResolvedValue({
      kind: 'subject',
      name: '测试条目',
      url: '/subject/42',
    });
    mockedGetSubjectId.mockReturnValue('42');

    await checkSubjectAndOpenEntry(
      { type: SubjectTypeId.game, subjectInfo: { name: '测试条目' } },
      runtime
    );

    expect(runtime.notify).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'info', message: expect.stringContaining('搜索中') })
    );
    expect(runtime.notify).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'info', message: '', cmd: 'dismissNotError' })
    );
  });

  test('creates a new subject when search returns no result', async () => {
    const runtime = createRuntime();
    mockedCheckSubjectExit.mockResolvedValue(undefined);

    await checkSubjectAndOpenEntry(
      { type: SubjectTypeId.game, subjectInfo: { name: '测试条目' } },
      runtime
    );

    expect(runtime.openExistingSubject).not.toHaveBeenCalled();
    expect(runtime.openNewSubject).toHaveBeenCalledWith(SubjectTypeId.game);
  });

  test('passes auxSite to createNewSubjectEntry when search returns no result', async () => {
    const runtime = createRuntime();
    const auxSite = { url: 'https://store.steampowered.com/app/123' };
    mockedCheckSubjectExit.mockResolvedValue(undefined);

    await checkSubjectAndOpenEntry(
      { type: SubjectTypeId.game, subjectInfo: { name: '测试条目' }, auxSite },
      runtime
    );

    expect(runtime.updateAuxData).toHaveBeenCalledWith(auxSite);
    expect(runtime.openNewSubject).toHaveBeenCalledWith(SubjectTypeId.game);
  });

  test('skips search and creates new subject when subjectInfo has no name', async () => {
    const runtime = createRuntime();

    await checkSubjectAndOpenEntry(
      { type: SubjectTypeId.game, subjectInfo: {} },
      runtime
    );

    expect(mockedCheckSubjectExit).not.toHaveBeenCalled();
    expect(runtime.openNewSubject).toHaveBeenCalledWith(SubjectTypeId.game);
  });

  test('skips search and creates new subject when subjectInfo is absent', async () => {
    const runtime = createRuntime();
    const auxSite = { url: 'https://store.steampowered.com/app/123' };

    await checkSubjectAndOpenEntry(
      { type: SubjectTypeId.game, auxSite },
      runtime
    );

    expect(mockedCheckSubjectExit).not.toHaveBeenCalled();
    expect(runtime.updateAuxData).toHaveBeenCalledWith(auxSite);
    expect(runtime.openNewSubject).toHaveBeenCalledWith(SubjectTypeId.game);
  });

  test('does not create a new subject when search request fails', async () => {
    const runtime = createRuntime();
    mockedCheckSubjectExit.mockRejectedValue(new Error('network error'));

    await expect(
      checkSubjectAndOpenEntry(
        { type: SubjectTypeId.game, subjectInfo: { name: '测试条目' } },
        runtime
      )
    ).rejects.toThrow('network error');

    expect(runtime.openNewSubject).not.toHaveBeenCalled();
    expect(runtime.notify).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'error' })
    );
  });
});
