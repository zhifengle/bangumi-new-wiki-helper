import browser from 'webextension-polyfill';
import { BackgroundMessage } from '../interface/messages';
import { RuntimeNotifyPayload } from '../runtime/capabilities';
import { BrowserConfig } from '../runtime/browserConfig';
import { updateSubjectDraftFromAuxSite } from '../runtime/auxData';
import { createBackgroundRuntimeCapabilities } from './runtimeCapabilities';
import {
  checkSubjectAndOpenEntry,
  createNewSubjectEntry,
} from '../runtime/subjectCreation';
import { APP_VERSION } from '../version';

// Re-export from sub-modules for backward compatibility
export {
  isChromeUserAgent,
  hasExtraHeadersSupport,
  createHeaderListenerOptions,
  appendGetchuRefererHeader,
} from './headerRules';

import {
  isChromeUserAgent,
  hasExtraHeadersSupport,
  createHeaderListenerOptions,
  appendGetchuRefererHeader,
} from './headerRules';
import { createConfigController } from './configController';
import { buildSubjectCreationRuntime } from './subjectRuntime';
import { handleFetchMessage, handleSubjectCreationMessage } from './messageHandlers';

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

export function createBackgroundController(
  options: BackgroundControllerOptions = {}
) {
  const browserApi = options.browserApi ?? browser;
  const appVersion = options.appVersion ?? APP_VERSION;
  const createCapabilities =
    options.createCapabilities ?? createBackgroundRuntimeCapabilities;
  const updateAuxDataDraft =
    options.updateAuxDataDraft ?? updateSubjectDraftFromAuxSite;
  const supportsExtraHeaders =
    options.supportsExtraHeaders ??
    (isChromeUserAgent(options.userAgent ?? navigator.userAgent) &&
      hasExtraHeadersSupport());

  const configController = createConfigController({ browserApi, appVersion });
  const { setConfig, getConfig } = configController;

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

  function createSubjectCreationRuntime() {
    const capabilities = createCapabilities({
      active: getConfig().activeOpen,
      notify: sendMsgToCurrentTab,
    });
    const notify = capabilities.notifier?.notify;
    const openTab = capabilities.navigator?.openTab;
    if (!notify || !openTab) {
      throw new Error('background capabilities are missing notifier or navigator');
    }
    return buildSubjectCreationRuntime({
      getConfig,
      createCapabilities,
      sendMsgToCurrentTab,
      updateAuxDataDraft,
      notify,
      openTab,
    });
  }

  async function handleMessage(request: BackgroundMessage) {
    const capabilities = createCapabilities({
      active: getConfig().activeOpen,
      notify: sendMsgToCurrentTab,
    });
    switch (request.action) {
      case 'fetch_data_bg':
        return handleFetchMessage(request, capabilities);
      case 'check_subject_exist':
      case 'create_new_subject':
      case 'create_new_character':
        return handleSubjectCreationMessage(
          request,
          createSubjectCreationRuntime(),
          browserApi,
          getConfig().activeOpen,
          {
            checkSubjectEntry: options.checkSubjectEntry,
            createSubjectEntry: options.createSubjectEntry,
          }
        );
      default:
        return assertNever(request);
    }
  }

  async function init() {
    await configController.initConfig((config: BrowserConfig) => {
      console.log('E_CONFIG: ', config);
    });

    browserApi.runtime.onMessage.addListener(handleMessage);
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
