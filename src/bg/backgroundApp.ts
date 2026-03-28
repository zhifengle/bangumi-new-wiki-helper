import browser from 'webextension-polyfill';
import { SubjectTypeId } from '../interface/wiki';
import { BackgroundMessage } from '../interface/messages';
import { AuxSitePayload } from '../interface/types';
import { updateSubjectDraftFromAuxSite } from '../runtime/auxData';
import { RuntimeNotifyPayload } from '../runtime/capabilities';
import {
  BrowserConfig,
  BrowserStorageState,
  DEFAULT_BROWSER_CONFIG,
  buildBangumiHost,
  normalizeBrowserConfig,
} from '../runtime/browserConfig';
import { createBackgroundRuntimeCapabilities } from './runtimeCapabilities';
import {
  checkSubjectAndOpenEntry,
  createNewSubjectEntry,
  SubjectCreationRuntime,
} from '../runtime/subjectCreation';
import { APP_VERSION } from '../version';

type HeaderListenerOption = 'blocking' | 'requestHeaders' | 'extraHeaders';

type WebRequestHeader = {
  name: string;
  value?: string;
};

type WebRequestDetails = {
  url?: string;
  requestHeaders?: WebRequestHeader[];
};

type ChromeGlobals = typeof globalThis & {
  chrome?: {
    webRequest?: {
      OnBeforeSendHeadersOptions?: {
        EXTRA_HEADERS?: unknown;
      };
    };
  };
};

type BackgroundControllerOptions = {
  browserApi?: typeof browser;
  appVersion?: string;
  createCapabilities?: typeof createBackgroundRuntimeCapabilities;
  updateAuxDataDraft?: typeof updateSubjectDraftFromAuxSite;
  checkSubjectEntry?: typeof checkSubjectAndOpenEntry;
  createSubjectEntry?: typeof createNewSubjectEntry;
  userAgent?: string;
  supportsExtraHeaders?: boolean;
};

export function isChromeUserAgent(userAgent: string) {
  return /Chrome\/(\d+)\.(\d+)/.test(userAgent);
}

export function hasExtraHeadersSupport() {
  const options = (globalThis as ChromeGlobals).chrome?.webRequest
    ?.OnBeforeSendHeadersOptions;
  return !!options && Object.prototype.hasOwnProperty.call(options, 'EXTRA_HEADERS');
}

export function createHeaderListenerOptions(
  type: Extract<HeaderListenerOption, 'requestHeaders'>,
  enableExtraHeaders: boolean
): HeaderListenerOption[] {
  const result: HeaderListenerOption[] = ['blocking', type];
  if (enableExtraHeaders) {
    result.push('extraHeaders');
  }
  return result;
}

export function appendGetchuRefererHeader(details: WebRequestDetails) {
  const match = (details?.url ?? '').match(/brandnew\/(\d+)/);
  const requestHeaders = [...(details.requestHeaders ?? [])];
  if (match) {
    requestHeaders.push({
      name: 'Referer',
      value: `http://www.getchu.com/soft.phtml?id=${match[1]}`,
    });
  }
  return { requestHeaders };
}

export function createBackgroundController(
  options: BackgroundControllerOptions = {}
) {
  const browserApi = options.browserApi ?? browser;
  const appVersion = options.appVersion ?? APP_VERSION;
  const createCapabilities =
    options.createCapabilities ?? createBackgroundRuntimeCapabilities;
  const updateAuxDataDraft =
    options.updateAuxDataDraft ?? updateSubjectDraftFromAuxSite;
  const checkSubjectEntry =
    options.checkSubjectEntry ?? checkSubjectAndOpenEntry;
  const createSubjectEntry =
    options.createSubjectEntry ?? createNewSubjectEntry;
  const supportsExtraHeaders =
    options.supportsExtraHeaders ??
    (isChromeUserAgent(options.userAgent ?? navigator.userAgent) &&
      hasExtraHeadersSupport());

  let userConfig: BrowserConfig = DEFAULT_BROWSER_CONFIG;

  function setConfig(config?: Partial<BrowserConfig> | null) {
    userConfig = normalizeBrowserConfig(config);
  }

  function getConfig() {
    return userConfig;
  }

  async function sendMsgToCurrentTab(payload: RuntimeNotifyPayload) {
    const tabs = await browserApi.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeTabId = tabs?.[0]?.id;
    if (typeof activeTabId === 'number') {
      await browserApi.tabs.sendMessage(activeTabId, payload);
    }
  }

  function createSubjectCreationRuntime(): SubjectCreationRuntime {
    const capabilities = createCapabilities({
      active: userConfig.activeOpen,
      notify: sendMsgToCurrentTab,
    });
    const notify = capabilities.notifier?.notify;
    const openTab = capabilities.navigator?.openTab;
    if (!notify || !openTab) {
      throw new Error('background capabilities are missing notifier or navigator');
    }
    const bgmHost = buildBangumiHost(userConfig);
    return {
      bgmHost,
      notify,
      updateAuxData,
      saveSubjectId(subjectId) {
        return capabilities.storage.saveSubjectId(subjectId);
      },
      async openExistingSubject(url: string) {
        await openTab(bgmHost + url);
      },
      async openNewSubject(type: SubjectTypeId) {
        await openTab(`${bgmHost}/new_subject/${type}`);
      },
    };
  }

  async function updateAuxData(payload: AuxSitePayload) {
    const capabilities = createCapabilities({
      active: userConfig.activeOpen,
      notify: sendMsgToCurrentTab,
    });
    if (!capabilities.notifier) {
      throw new Error('background notifier capability is missing');
    }
    await updateAuxDataDraft(payload, {
      storage: capabilities.storage,
      notifier: capabilities.notifier,
    });
  }

  function getBangumiHost() {
    return buildBangumiHost(userConfig);
  }

  async function handleMessage(request: BackgroundMessage) {
    const subjectCreationRuntime = createSubjectCreationRuntime();
    const capabilities = createCapabilities({
      active: userConfig.activeOpen,
      notify: sendMsgToCurrentTab,
    });
    switch (request.action) {
      case 'check_subject_exist':
        return checkSubjectEntry(request.payload, subjectCreationRuntime);
      case 'create_new_subject':
        return createSubjectEntry(request.payload, subjectCreationRuntime);
      case 'create_new_character':
        await browserApi.tabs.create({
          url: `${getBangumiHost()}/character/new`,
          active: userConfig.activeOpen,
        });
        return;
      case 'fetch_data_bg': {
        const { payload } = request;
        if (payload.type === 'img') {
          return capabilities.transport.fetchImage?.(payload.url, payload.headers);
        }
        return capabilities.transport.fetchHtml(payload.url);
      }
      default:
        return assertNever(request);
    }
  }

  async function init() {
    const state = (await browserApi.storage.local.get([
      'version',
      'config',
    ])) as BrowserStorageState;
    if (!state.version || state.version !== appVersion) {
      await browserApi.storage.local.set({
        version: appVersion,
        config: DEFAULT_BROWSER_CONFIG,
      });
      userConfig = DEFAULT_BROWSER_CONFIG;
    } else {
      setConfig(state.config);
    }

    browserApi.runtime.onMessage.addListener(handleMessage);
    browserApi.storage.onChanged.addListener(
      async (changes: Record<string, { newValue?: unknown }>) => {
        if (changes.config) {
          const nextState = (await browserApi.storage.local.get([
            'config',
          ])) as BrowserStorageState;
          setConfig(nextState.config);
          console.log('E_CONFIG: ', userConfig);
        }
      }
    );
    browserApi.webRequest.onBeforeSendHeaders.addListener(
      appendGetchuRefererHeader,
      {
        urls: ['*://*/brandnew/*'],
      },
      createHeaderListenerOptions('requestHeaders', supportsExtraHeaders)
    );
  }

  return {
    getConfig,
    handleMessage,
    init,
    setConfig,
  };
}

export function initBackgroundApp() {
  const controller = createBackgroundController();
  return controller.init();
}

function assertNever(value: never): never {
  throw new Error(`Unhandled background message: ${JSON.stringify(value)}`);
}
