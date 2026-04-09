// @vitest-environment jsdom
import { vi, type Mocked, type MockedFunction } from 'vitest';
import { SubjectTypeId } from '../interface/wiki';
import { initBangumiPage } from './bangumiPage';
import { BangumiPageRuntimeAdapter } from './bangumiRuntime';
import {
  initNewCharacter,
  initNewSubject,
  initUploadImg,
} from '../sites/bangumi/newSubject';

vi.mock('../sites/bangumi/newSubject', () => ({
  initNewSubject: vi.fn(),
  initNewCharacter: vi.fn(),
  initUploadImg: vi.fn(),
}));

const mockedInitNewSubject = initNewSubject as MockedFunction<
  typeof initNewSubject
>;
const mockedInitNewCharacter = initNewCharacter as MockedFunction<
  typeof initNewCharacter
>;
const mockedInitUploadImg = initUploadImg as MockedFunction<
  typeof initUploadImg
>;

function setPath(pathname: string) {
  window.history.replaceState({}, '', pathname);
}

function createRuntime(
  overrides: Partial<BangumiPageRuntimeAdapter & { state: unknown }> = {}
): Mocked<BangumiPageRuntimeAdapter> {
  return {
    loadPageState: vi
      .fn()
      .mockResolvedValue((overrides as { state?: unknown }).state ?? {}),
    clearInfo: vi.fn(),
    markAutoFillConsumed: vi.fn(),
  };
}

describe('initBangumiPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('initializes new subject page and consumes autofill state', async () => {
    vi.useFakeTimers();
    setPath('/new_subject/4');
    document.body.innerHTML = '<button class="e-wiki-fill-form">fill</button>';
    const clickSpy = vi.fn();
    document
      .querySelector('.e-wiki-fill-form')
      ?.addEventListener('click', clickSpy);
    const wikiData = {
      type: SubjectTypeId.game,
      infos: [{ name: '标题', value: '测试条目' }],
    };
    const runtime = createRuntime({
      state: {
        wikiData,
        shouldAutoFill: true,
        autoFillDelay: 10,
      },
    });

    await initBangumiPage(runtime);
    vi.advanceTimersByTime(10);
    await Promise.resolve();

    expect(mockedInitNewSubject).toHaveBeenCalledWith(wikiData);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(runtime.markAutoFillConsumed).toHaveBeenCalled();
    vi.useRealTimers();
  });

  test('responds to clearInfo script message', async () => {
    setPath('/new_subject/4');
    const runtime = createRuntime({
      state: {
        wikiData: {
          type: SubjectTypeId.game,
          infos: [],
        },
      },
    });

    await initBangumiPage(runtime);
    window.dispatchEvent(
      new CustomEvent('scriptMessage', {
        detail: {
          type: 'clearInfo',
        },
      })
    );
    await Promise.resolve();

    expect(runtime.clearInfo).toHaveBeenCalledTimes(1);
  });

  test('initializes character and upload image pages with runtime state', async () => {
    const charaData = {
      type: SubjectTypeId.game,
      infos: [{ name: '角色名', value: 'Alice', category: 'crt_name' }],
    };
    const wikiData = {
      type: SubjectTypeId.game,
      infos: [{ name: '封面', value: { dataUrl: 'data:image/png;base64,1' } }],
    };

    setPath('/character/new');
    await initBangumiPage(
      createRuntime({
        state: {
          charaData,
          subjectId: 321,
        },
      })
    );
    expect(mockedInitNewCharacter).toHaveBeenCalledWith(charaData, 321);

    setPath('/upload_img');
    await initBangumiPage(
      createRuntime({
        state: {
          wikiData,
        },
      })
    );
    expect(mockedInitUploadImg).toHaveBeenCalledWith(wikiData);
  });
});
