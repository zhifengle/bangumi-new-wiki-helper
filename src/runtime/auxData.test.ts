import { vi, type MockedFunction } from 'vitest';
import { SubjectTypeId } from '../interface/wiki';
import { combineInfoList } from '../sites/core/merge';
import { getWikiDataByURL } from '../sites/core/remote';
import { updateSubjectDraftFromAuxSite, AuxDataRuntime } from './auxData';

vi.mock('../sites/core/merge', () => ({
  combineInfoList: vi.fn(),
}));

vi.mock('../sites/core/remote', () => ({
  getWikiDataByURL: vi.fn(),
}));

const mockedCombineInfoList = combineInfoList as MockedFunction<typeof combineInfoList>;
const mockedGetWikiDataByURL = getWikiDataByURL as MockedFunction<typeof getWikiDataByURL>;

type MockedAuxDataRuntime = AuxDataRuntime & {
  storage: {
    saveSubjectDraft: MockedFunction<AuxDataRuntime['storage']['saveSubjectDraft']>;
    loadSubjectDraft: MockedFunction<AuxDataRuntime['storage']['loadSubjectDraft']>;
    saveCharacterDraft: MockedFunction<
      AuxDataRuntime['storage']['saveCharacterDraft']
    >;
    loadCharacterDraft: MockedFunction<
      AuxDataRuntime['storage']['loadCharacterDraft']
    >;
    saveSubjectId: MockedFunction<AuxDataRuntime['storage']['saveSubjectId']>;
    loadSubjectId: MockedFunction<AuxDataRuntime['storage']['loadSubjectId']>;
    loadBangumiPageState: MockedFunction<
      AuxDataRuntime['storage']['loadBangumiPageState']
    >;
    clearBangumiPageState: MockedFunction<
      AuxDataRuntime['storage']['clearBangumiPageState']
    >;
  };
  notifier: {
    notify: MockedFunction<AuxDataRuntime['notifier']['notify']>;
  };
};

function createRuntime(): MockedAuxDataRuntime {
  return {
    storage: {
      saveSubjectDraft: vi.fn(),
      loadSubjectDraft: vi.fn(),
      saveCharacterDraft: vi.fn(),
      loadCharacterDraft: vi.fn(),
      saveSubjectId: vi.fn(),
      loadSubjectId: vi.fn(),
      loadBangumiPageState: vi.fn(),
      clearBangumiPageState: vi.fn(),
    },
    notifier: {
      notify: vi.fn(),
    },
  };
}

describe('updateSubjectDraftFromAuxSite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetches aux data and saves merged subject draft', async () => {
    const runtime = createRuntime();
    const wikiData = {
      type: SubjectTypeId.game,
      subtype: 2,
      infos: [{ name: '标题', value: '原始条目' }],
    };
    const auxData = [{ name: '别名', value: '辅助条目' }];
    const mergedInfos = [{ name: '标题', value: '合并结果' }];

    runtime.storage.loadSubjectDraft.mockResolvedValue(wikiData);
    mockedGetWikiDataByURL.mockResolvedValue(auxData);
    mockedCombineInfoList.mockReturnValue(mergedInfos);

    await updateSubjectDraftFromAuxSite(
      {
        url: 'https://example.com/item/1',
        opts: {
          headers: {
            Referer: 'https://example.com',
          },
        },
        prefs: {
          originNames: ['标题'],
        },
      },
      runtime
    );

    expect(mockedGetWikiDataByURL).toHaveBeenCalledWith(
      'https://example.com/item/1',
      {
        headers: {
          Referer: 'https://example.com',
        },
      }
    );
    expect(mockedCombineInfoList).toHaveBeenCalledWith(
      wikiData.infos,
      auxData,
      {
        originNames: ['标题'],
      }
    );
    expect(runtime.storage.saveSubjectDraft).toHaveBeenCalledWith({
      type: SubjectTypeId.game,
      subtype: 2,
      infos: mergedInfos,
    });
    expect(runtime.notifier.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        message: expect.stringContaining('抓取第三方网站信息成功'),
      })
    );
  });

  test('notifies error when aux fetch fails', async () => {
    const runtime = createRuntime();
    mockedGetWikiDataByURL.mockRejectedValue(new Error('network error'));

    await updateSubjectDraftFromAuxSite(
      {
        url: 'https://example.com/item/2',
      },
      runtime
    );

    expect(runtime.storage.saveSubjectDraft).not.toHaveBeenCalled();
    expect(runtime.notifier.notify).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: 'error',
        message: expect.stringContaining('抓取信息失败'),
      })
    );
  });
});
