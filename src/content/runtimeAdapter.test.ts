// @vitest-environment jsdom
import { vi } from 'vitest';
import { SubjectTypeId } from '../interface/wiki';

const { mockContentRuntimeCapabilities } = vi.hoisted(() => ({
  mockContentRuntimeCapabilities: {
    transport: {
      fetchHtml: vi.fn(),
      fetchImage: vi.fn(),
    },
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
    subjectCreation: {
      checkSubjectExist: vi.fn(),
      createNewSubject: vi.fn(),
      createNewCharacter: vi.fn(),
    },
  },
}));

vi.mock('./runtimeCapabilities', () => ({
  contentRuntimeCapabilities: mockContentRuntimeCapabilities,
}));

import { contentRuntimeAdapter } from './runtimeAdapter';

const globalAny = globalThis as Record<string, unknown>;
const originalLocation = globalAny.location;

const siteConfig = {
  key: 'steam_game' as const,
  description: 'test site',
  host: ['store.steampowered.com'],
  pageSelectors: [],
  controlSelector: {
    selector: '#app',
  },
  type: SubjectTypeId.game,
  itemList: [],
};

describe('contentRuntimeAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalAny, 'location', {
      configurable: true,
      value: {
        href: 'https://bgm.tv/new_subject/4',
      },
    });
  });

  afterAll(() => {
    Object.defineProperty(globalAny, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  test('hydrates subject cover through background transport', async () => {
    mockContentRuntimeCapabilities.transport.fetchImage.mockResolvedValue(
      'data:image/png;base64,cover'
    );
    const infoList = [
      {
        name: '封面',
        category: 'cover',
        value: {
          url: '/brandnew/123/c0.jpg',
          dataUrl: '',
        },
      },
    ];

    await contentRuntimeAdapter.hydrateSubjectCover?.(infoList);

    expect(
      mockContentRuntimeCapabilities.transport.fetchImage
    ).toHaveBeenCalledWith('https://bgm.tv/brandnew/123/c0.jpg', {
      Referer: 'http://www.getchu.com/soft.phtml?id=123',
    });
    expect(infoList[0].value).toEqual({
      url: 'https://bgm.tv/brandnew/123/c0.jpg',
      dataUrl: 'data:image/png;base64,cover',
    });
  });

  test('saves draft before checking subject duplication', async () => {
    const wikiData = {
      type: SubjectTypeId.game,
      infos: [{ name: '标题', value: '测试条目' }],
    };
    const queryInfo = {
      kind: 'subject' as const,
      name: '测试条目',
    };

    await contentRuntimeAdapter.submitSubjectCreation({
      siteConfig,
      wikiData,
      queryInfo,
      payload: {
        disableDate: true,
      },
      shouldCheckDup: true,
    });

    expect(
      mockContentRuntimeCapabilities.storage.saveSubjectDraft
    ).toHaveBeenCalledWith(wikiData);
    expect(
      mockContentRuntimeCapabilities.subjectCreation.checkSubjectExist
    ).toHaveBeenCalledWith({
      subjectInfo: queryInfo,
      type: SubjectTypeId.game,
      disableDate: true,
    });
    expect(
      mockContentRuntimeCapabilities.subjectCreation.createNewSubject
    ).not.toHaveBeenCalled();
  });

  test('saves character draft before creating a new character', async () => {
    const charaData = {
      type: SubjectTypeId.game,
      infos: [{ name: '角色名', value: 'Alice', category: 'crt_name' }],
    };

    await contentRuntimeAdapter.submitCharacterCreation({
      siteConfig,
      charaData,
    });

    expect(
      mockContentRuntimeCapabilities.storage.saveCharacterDraft
    ).toHaveBeenCalledWith(charaData);
    expect(
      mockContentRuntimeCapabilities.subjectCreation.createNewCharacter
    ).toHaveBeenCalled();
  });
});
