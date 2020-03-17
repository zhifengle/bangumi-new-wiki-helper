// @ts-ignore
import browser from 'webextension-polyfill';
import {
  BangumiDomain,
  changeDomain,
  checkBookSubjectExist
} from "../sites/bangumi";
import {SubjectTypeId} from "../interface/wiki";
// import { version as VERSION } from "../../extension/manifest.json";

const VERSION = '0.3.0'

interface Config {
  domain?: BangumiDomain
  activeOpen?: boolean
  useHttps?: boolean
  autoFill?: boolean
}

let E_USER_CONFIG: Config = {};

async function handleMessage(request: any) {
  const { payload = {} } = request;
  const activeOpen = E_USER_CONFIG.activeOpen;
  let bgmHost = E_USER_CONFIG.domain as string;
  if (E_USER_CONFIG.useHttps) {
    bgmHost = `https://${bgmHost}`
  } else {
    bgmHost = `http://${bgmHost}`
  }
  switch (request.action) {
    case 'check_subject_exist':
      try {
        if (payload.subjectInfo) {
          const result = await checkBookSubjectExist(
            payload.subjectInfo,
            bgmHost,
            payload.type
          )
          console.info('search results: ', result)
          if (result && result.url) {
            await browser.tabs.create({
              url: bgmHost+result.url,
              active: activeOpen
            });
          } else {
            createNewSubjectTab(payload.type, bgmHost, activeOpen)
          }
        } else {
          createNewSubjectTab(payload.type, bgmHost, activeOpen)
        }
      } catch (e) {
        /* handle error */
        console.log('fetch info err:', e, e.message);
      }
      break;
    case 'create_new_subject':
      createNewSubjectTab(payload.type, bgmHost, activeOpen)
      break;
    default:
  }
}
function createNewSubjectTab(
  type: SubjectTypeId,
  bgmHost: string,
  active: boolean) {
  let url =  `${bgmHost}/new_subject/${type}`;
  browser.tabs.create({
    url,
    active
  });
}

async function init() {
  // 初始化设置
  const obj = await browser.storage.local.get();
  if (obj && !obj.version || obj.version !== VERSION) {
    // await browser.storage.local.clear();
    await browser.storage.local.set({
      version: VERSION,
      config: {
        // searchSubject: false,
        // newSubjectType: 1,
        domain: 'bgm.tv',
        activeOpen: false,
        useHttps: true,
        autoFill: false
      }
    });
  } else {
    E_USER_CONFIG = obj.config;
  }

  browser.runtime.onMessage.addListener(handleMessage);
  // 监听配置修改的变化
  browser.storage.onChanged.addListener(async function(changes: any) {
    if (changes.config) {
      E_USER_CONFIG = (await browser.storage.local.get()).config;
      console.log('E_CONFIG: ', E_USER_CONFIG)
    }
  });
}

init()

