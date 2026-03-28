import { SubjectTypeId } from '../interface/wiki';
import { combineInfoList } from '../sites/core/merge';
import { getWikiDataByURL } from '../sites/core/remote';
import { updateSubjectDraftFromAuxSite, AuxDataRuntime } from './auxData';

jest.mock('../sites/core/merge', () => ({
  combineInfoList: jest.fn(),
}));

jest.mock('../sites/core/remote', () => ({
  getWikiDataByURL: jest.fn(),
}));

const mockedCombineInfoList = combineInfoList as jest.MockedFunction<
  typeof combineInfoList
>;
const mockedGetWikiDataByURL = getWikiDataByURL as jest.MockedFunction<
  typeof getWikiDataByURL
>;

type MockedAuxDataRuntime = AuxDataRuntime & {
  storage: {
    saveSubjectDraft: jest.MockedFunction<AuxDataRuntime['storage']['saveSubjectDraft']>;
    loadSubjectDraft: jest.MockedFunction<AuxDataRuntime['storage']['loadSubjectDraft']>;
    saveCharacterDraft: jest.MockedFunction<
      AuxDataRuntime['storage']['saveCharacterDraft']
    >;
    loadCharacterDraft: jest.MockedFunction<
      AuxDataRuntime['storage']['loadCharacterDraft']
    >;
    saveSubjectId: jest.MockedFunction<AuxDataRuntime['storage']['saveSubjectId']>;
    loadSubjectId: jest.MockedFunction<AuxDataRuntime['storage']['loadSubjectId']>;
    loadBangumiPageState: jest.MockedFunction<
      AuxDataRuntime['storage']['loadBangumiPageState']
    >;
    clearBangumiPageState: jest.MockedFunction<
      AuxDataRuntime['storage']['clearBangumiPageState']
    >;
  };
  notifier: {
    notify: jest.MockedFunction<AuxDataRuntime['notifier']['notify']>;
  };
};

function createRuntime(): MockedAuxDataRuntime {
  return {
    storage: {
      saveSubjectDraft: jest.fn(),
      loadSubjectDraft: jest.fn(),
      saveCharacterDraft: jest.fn(),
      loadCharacterDraft: jest.fn(),
      saveSubjectId: jest.fn(),
      loadSubjectId: jest.fn(),
      loadBangumiPageState: jest.fn(),
      clearBangumiPageState: jest.fn(),
    },
    notifier: {
      notify: jest.fn(),
    },
  };
}

describe('updateSubjectDraftFromAuxSite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
