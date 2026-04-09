import { vi, type Mocked, type MockedFunction } from 'vitest';
import { SubjectTypeId } from '../interface/wiki';
import {
  checkSubjectAndOpenEntry,
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

describe('subjectCreation runtime', () => {
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
      {
        type: SubjectTypeId.game,
        subjectInfo: {
          name: '测试条目',
        },
      },
      runtime
    );

    expect(mockedCheckSubjectExit).toHaveBeenCalledWith(
      {
        name: '测试条目',
      },
      'https://bgm.tv',
      SubjectTypeId.game,
      undefined
    );
    expect(runtime.saveSubjectId).toHaveBeenCalledWith('42');
    expect(runtime.openExistingSubject).toHaveBeenCalledWith('/subject/42');
    expect(runtime.openNewSubject).not.toHaveBeenCalled();
  });

  test('creates a new subject entry when there is no subject info to search', async () => {
    const runtime = createRuntime();
    const auxSite = {
      url: 'https://store.steampowered.com/app/123',
    };

    await checkSubjectAndOpenEntry(
      {
        type: SubjectTypeId.game,
        auxSite,
      },
      runtime
    );

    expect(runtime.updateAuxData).toHaveBeenCalledWith(auxSite);
    expect(runtime.openNewSubject).toHaveBeenCalledWith(SubjectTypeId.game);
    expect(mockedCheckSubjectExit).not.toHaveBeenCalled();
  });
});
