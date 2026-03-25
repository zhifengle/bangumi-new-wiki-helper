import browser from 'webextension-polyfill';
import { BangumiDomain } from '../sites/bangumi';
import { SubjectTypeId } from '../interface/wiki';
import { getImageDataByURL } from '../utils/dealImage';
import { fetchText } from '../utils/fetchData';
import { BackgroundMessage } from '../interface/messages';
import { AuxSitePayload, LogMsg } from '../interface/types';
import { updateSubjectDraftFromAuxSite } from '../runtime/auxData';
import { browserDraftStore } from '../runtime/browserDraftStore';
import {
  checkSubjectAndOpenEntry,
  createNewSubjectEntry,
  SubjectCreationRuntime,
} from '../runtime/subjectCreation';
import { APP_VERSION } from '../version';

interface Config {
  domain?: BangumiDomain;
  activeOpen?: boolean;
  useHttps?: boolean;
  autoFill?: boolean;
}

let E_USER_CONFIG: Config = {};

// ref: header editor
const IS_CHROME = /Chrome\/(\d+)\.(\d+)/.test(navigator.userAgent);

async function sendMsgToCurrentTab(
  payload: LogMsg & Record<string, string | number>
) {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (tabs && Array.isArray(tabs) && tabs[0]) {
    browser.tabs.sendMessage(tabs[0].id, payload);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled background message: ${JSON.stringify(value)}`);
}

async function handleMessage(request: BackgroundMessage) {
  const activeOpen = E_USER_CONFIG.activeOpen;
  let bgmHost = E_USER_CONFIG.domain as string;
  if (E_USER_CONFIG.useHttps) {
    bgmHost = `https://${bgmHost}`;
  } else {
    bgmHost = `http://${bgmHost}`;
  }
  const subjectCreationRuntime = createBackgroundSubjectCreationRuntime(
    bgmHost,
    !!activeOpen
  );
  switch (request.action) {
    case 'check_subject_exist':
      return checkSubjectAndOpenEntry(request.payload, subjectCreationRuntime);
    case 'create_new_subject':
      return createNewSubjectEntry(request.payload, subjectCreationRuntime);
    case 'create_new_character':
      browser.tabs.create({
        url: `${bgmHost}/character/new`,
        active: activeOpen,
      });
      return;
    case 'fetch_data_bg': {
      const { payload } = request;
      if (payload.type == 'img') {
        return getImageDataByURL(payload.url, {
          headers: payload.headers,
        });
      }
      return fetchText(payload.url);
    }
    default:
      return assertNever(request);
  }
}

async function updateAuxData(payload: AuxSitePayload) {
  await updateSubjectDraftFromAuxSite(payload, {
    draftStore: browserDraftStore,
    notify: sendMsgToCurrentTab,
  });
}

function createBackgroundSubjectCreationRuntime(
  bgmHost: string,
  active: boolean
): SubjectCreationRuntime {
  return {
    bgmHost,
    notify: sendMsgToCurrentTab,
    updateAuxData,
    saveSubjectId(subjectId) {
      return browserDraftStore.saveSubjectId(subjectId);
    },
    async openExistingSubject(url: string) {
      await browser.tabs.create({
        url: bgmHost + url,
        active,
      });
    },
    async openNewSubject(type: SubjectTypeId) {
      await browser.tabs.create({
        url: `${bgmHost}/new_subject/${type}`,
        active,
      });
    },
  };
}

function createHeaderListener(type: string): any {
  const result = ['blocking'];
  result.push(type);
  if (
    IS_CHROME &&
    // @ts-ignore
    chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')
  ) {
    result.push('extraHeaders');
  }
  return result;
}
async function init() {
  // 初始化设置
  const obj = await browser.storage.local.get(['version', 'config']);
  if ((obj && !obj.version) || obj.version !== APP_VERSION) {
    // await browser.storage.local.clear();
    await browser.storage.local.set({
      version: APP_VERSION,
      config: {
        domain: BangumiDomain.bgm,
        activeOpen: false,
        useHttps: true,
        autoFill: false,
        subjectId: 0,
      },
    });
  } else {
    E_USER_CONFIG = obj.config;
  }

  browser.runtime.onMessage.addListener(handleMessage);
  // 监听配置修改的变化
  browser.storage.onChanged.addListener(async function (changes: any) {
    if (changes.config) {
      E_USER_CONFIG = (await browser.storage.local.get(['config'])).config;
      console.log('E_CONFIG: ', E_USER_CONFIG);
    }
  });
  browser.webRequest.onBeforeSendHeaders.addListener(
    (obj) => {
      let m = (obj?.url ?? '').match(/brandnew\/(\d+)/);
      if (m) {
        obj.requestHeaders.push({
          name: 'Referer',
          value: `http://www.getchu.com/soft.phtml?id=${m[1]}`,
        });
      }
      return { requestHeaders: obj.requestHeaders };
    },
    {
      urls: ['*://*/brandnew/*'],
    },
    createHeaderListener('requestHeaders')
  );
}

init();
