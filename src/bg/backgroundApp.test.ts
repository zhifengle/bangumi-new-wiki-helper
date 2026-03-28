import browser from 'webextension-polyfill';
import { SubjectTypeId } from '../interface/wiki';
import { BangumiDomain } from '../sites/bangumi';
import {
  appendGetchuRefererHeader,
  createBackgroundController,
  createHeaderListenerOptions,
} from './backgroundApp';
import { DEFAULT_BROWSER_CONFIG } from '../runtime/browserConfig';

jest.mock('webextension-polyfill', () => ({}));

function createBrowserMock() {
  const runtimeListeners: Array<(request: unknown) => unknown> = [];
  const storageListeners: Array<
    (changes: Record<string, { newValue?: unknown }>) => unknown
  > = [];

  const browserMock = {
    tabs: {
      query: jest.fn().mockResolvedValue([{ id: 7 }]),
      sendMessage: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockResolvedValue(undefined),
    },
    runtime: {
      onMessage: {
        addListener: jest.fn((listener: (request: unknown) => unknown) => {
          runtimeListeners.push(listener);
        }),
      },
    },
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn().mockResolvedValue(undefined),
      },
      onChanged: {
        addListener: jest.fn(
          (listener: (changes: Record<string, { newValue?: unknown }>) => unknown) => {
            storageListeners.push(listener);
          }
        ),
      },
    },
    webRequest: {
      onBeforeSendHeaders: {
        addListener: jest.fn(),
      },
    },
  } as unknown as typeof browser;

  return {
    browserMock,
    runtimeListeners,
    storageListeners,
  };
}

describe('backgroundApp', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('seeds default config on init and registers listeners', async () => {
    const { browserMock } = createBrowserMock();
    browserMock.storage.local.get = jest.fn().mockResolvedValue({});
    const controller = createBackgroundController({
      browserApi: browserMock,
      appVersion: 'test-version',
      userAgent: 'Chrome/122.0',
      supportsExtraHeaders: true,
    });

    await controller.init();

    expect(browserMock.storage.local.set).toHaveBeenCalledWith({
      version: 'test-version',
      config: DEFAULT_BROWSER_CONFIG,
    });
    expect(controller.getConfig()).toEqual(DEFAULT_BROWSER_CONFIG);
    expect(browserMock.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
    expect(browserMock.storage.onChanged.addListener).toHaveBeenCalledTimes(1);
    expect(browserMock.webRequest.onBeforeSendHeaders.addListener).toHaveBeenCalledWith(
      appendGetchuRefererHeader,
      { urls: ['*://*/brandnew/*'] },
      ['blocking', 'requestHeaders', 'extraHeaders']
    );
  });

  test('routes background messages with normalized config', async () => {
    const { browserMock } = createBrowserMock();
    const checkSubjectEntry = jest.fn().mockResolvedValue(undefined);
    const createSubjectEntry = jest.fn().mockResolvedValue(undefined);
    const transport = {
      fetchHtml: jest.fn().mockResolvedValue('<html />'),
      fetchImage: jest.fn().mockResolvedValue('data:image/png;base64,1'),
    };
    const createCapabilities = jest.fn().mockReturnValue({
      transport,
      storage: {
        saveSubjectId: jest.fn().mockResolvedValue(undefined),
      },
      notifier: {
        notify: jest.fn().mockResolvedValue(undefined),
      },
      navigator: {
        openTab: jest.fn().mockResolvedValue(undefined),
      },
    });
    const controller = createBackgroundController({
      browserApi: browserMock,
      createCapabilities,
      checkSubjectEntry,
      createSubjectEntry,
      userAgent: 'Firefox/123.0',
      supportsExtraHeaders: false,
    });

    controller.setConfig({
      domain: BangumiDomain.chii,
      useHttps: false,
      activeOpen: true,
    });

    await controller.handleMessage({
      action: 'check_subject_exist',
      payload: {
        type: SubjectTypeId.game,
        subjectInfo: {
          name: '测试条目',
        },
      },
    });
    await controller.handleMessage({
      action: 'create_new_subject',
      payload: {
        type: SubjectTypeId.music,
      },
    });
    await controller.handleMessage({
      action: 'fetch_data_bg',
      payload: {
        type: 'img',
        url: 'https://example.com/cover.jpg',
      },
    });
    await controller.handleMessage({
      action: 'create_new_character',
    });

    expect(checkSubjectEntry).toHaveBeenCalledWith(
      {
        type: SubjectTypeId.game,
        subjectInfo: {
          name: '测试条目',
        },
      },
      expect.objectContaining({
        bgmHost: 'http://chii.in',
      })
    );
    expect(createSubjectEntry).toHaveBeenCalledWith(
      {
        type: SubjectTypeId.music,
      },
      expect.objectContaining({
        bgmHost: 'http://chii.in',
      })
    );
    expect(transport.fetchImage).toHaveBeenCalledWith(
      'https://example.com/cover.jpg',
      undefined
    );
    expect(browserMock.tabs.create).toHaveBeenCalledWith({
      url: 'http://chii.in/character/new',
      active: true,
    });
  });

  test('updates config when browser storage changes', async () => {
    const { browserMock, storageListeners } = createBrowserMock();
    browserMock.storage.local.get = jest
      .fn()
      .mockResolvedValueOnce({
        version: 'test-version',
        config: DEFAULT_BROWSER_CONFIG,
      })
      .mockResolvedValueOnce({
        config: {
          ...DEFAULT_BROWSER_CONFIG,
          useHttps: false,
          domain: BangumiDomain.chii,
        },
      });
    const controller = createBackgroundController({
      browserApi: browserMock,
      appVersion: 'test-version',
      userAgent: 'Firefox/123.0',
      supportsExtraHeaders: false,
    });

    await controller.init();
    await storageListeners[0]({
      config: {
        newValue: {
          ...DEFAULT_BROWSER_CONFIG,
          useHttps: false,
          domain: BangumiDomain.chii,
        },
      },
    });

    expect(controller.getConfig()).toEqual({
      ...DEFAULT_BROWSER_CONFIG,
      useHttps: false,
      domain: BangumiDomain.chii,
    });
  });

  test('creates webRequest listener options and referer headers deterministically', () => {
    expect(createHeaderListenerOptions('requestHeaders', false)).toEqual([
      'blocking',
      'requestHeaders',
    ]);
    expect(createHeaderListenerOptions('requestHeaders', true)).toEqual([
      'blocking',
      'requestHeaders',
      'extraHeaders',
    ]);
    expect(
      appendGetchuRefererHeader({
        url: 'https://example.com/brandnew/123/c0.jpg',
        requestHeaders: [],
      })
    ).toEqual({
      requestHeaders: [
        {
          name: 'Referer',
          value: 'http://www.getchu.com/soft.phtml?id=123',
        },
      ],
    });
  });
});
