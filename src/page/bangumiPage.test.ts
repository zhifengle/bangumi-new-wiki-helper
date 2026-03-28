/**
 * @jest-environment jsdom
 */
import { SubjectTypeId } from '../interface/wiki';
import { initBangumiPage } from './bangumiPage';
import { BangumiPageRuntimeAdapter } from './bangumiRuntime';
import {
  initNewCharacter,
  initNewSubject,
  initUploadImg,
} from '../sites/bangumi/newSubject';

jest.mock('../sites/bangumi/newSubject', () => ({
  initNewSubject: jest.fn(),
  initNewCharacter: jest.fn(),
  initUploadImg: jest.fn(),
}));

const mockedInitNewSubject = initNewSubject as jest.MockedFunction<
  typeof initNewSubject
>;
const mockedInitNewCharacter = initNewCharacter as jest.MockedFunction<
  typeof initNewCharacter
>;
const mockedInitUploadImg = initUploadImg as jest.MockedFunction<
  typeof initUploadImg
>;

function setPath(pathname: string) {
  window.history.replaceState({}, '', pathname);
}

function createRuntime(
  overrides: Partial<BangumiPageRuntimeAdapter & { state: unknown }> = {}
): jest.Mocked<BangumiPageRuntimeAdapter> {
  return {
    loadPageState: jest
      .fn()
      .mockResolvedValue((overrides as { state?: unknown }).state ?? {}),
    clearInfo: jest.fn(),
    markAutoFillConsumed: jest.fn(),
  };
}

describe('initBangumiPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('initializes new subject page and consumes autofill state', async () => {
    jest.useFakeTimers();
    setPath('/new_subject/4');
    document.body.innerHTML = '<button class="e-wiki-fill-form">fill</button>';
    const clickSpy = jest.fn();
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
    jest.advanceTimersByTime(10);
    await Promise.resolve();

    expect(mockedInitNewSubject).toHaveBeenCalledWith(wikiData);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(runtime.markAutoFillConsumed).toHaveBeenCalled();
    jest.useRealTimers();
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
