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
}

let E_CONFIG: Config = {};

async function handleMessage(request: any) {
  const { payload = {} } = request;
  switch (request.action) {
    case 'check_subject_exist':
      try {
        if (payload.subjectInfo) {
          const result = await checkBookSubjectExist(payload.subjectInfo, payload.type)
          console.info('search results: ', result)
          if (result && result.url) {
            await browser.tabs.create({
              url: changeDomain(result.url, E_CONFIG.domain),
              active: E_CONFIG.activeOpen
            });
          } else {
            createNewSubjectTab(payload.type, E_CONFIG.domain, E_CONFIG.activeOpen)
          }
        } else {
          createNewSubjectTab(payload.type, E_CONFIG.domain, E_CONFIG.activeOpen)
        }
      } catch (e) {
        /* handle error */
        console.log('fetch info err:', e, e.message);
      }
      break;
    case 'create_new_subject':
      createNewSubjectTab(payload.type, E_CONFIG.domain, E_CONFIG.activeOpen)
      break;
    default:
  }
}
function createNewSubjectTab(
  type: SubjectTypeId,
  domain: BangumiDomain,
  active: boolean) {
  let url =  `https://bgm.tv/new_subject/${type}`;
  url = changeDomain(url, domain);
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
        activeOpen: true,
        useHttps: true,
      }
    });
  } else {
    E_CONFIG = obj.config;
  }

  browser.runtime.onMessage.addListener(handleMessage);
  // 监听配置修改的变化
  browser.storage.onChanged.addListener(async function(changes: any) {
    console.log('changes: ', changes)
    if (changes.config) {
      E_CONFIG = (await browser.storage.local.get()).config;
      console.log('E_CONFIG: ', E_CONFIG)
    }
  });
}

init()

