import { browser } from 'webextension-polyfill-ts';
import { BangumiDomain, checkSubjectExit } from '../sites/bangumi';
import { SubjectTypeId } from '../interface/wiki';
import { getWikiDataByURL, combineInfoList } from '../sites/common';
import { setVal } from './utils';
import { getSubjectId } from '../sites/bangumi/common';
import { getImageDataByURL } from '../utils/dealImage';
import { fetchText } from '../utils/fetchData';
import { ExtMsg, IAuxPrefs, IFetchOpts } from '../interface/types';
// import { version as VERSION } from "../../extension/manifest.json";

const VERSION = '0.3.0';

interface Config {
  domain?: BangumiDomain;
  activeOpen?: boolean;
  useHttps?: boolean;
  autoFill?: boolean;
}

let E_USER_CONFIG: Config = {};

async function handleMessage(request: ExtMsg) {
  const { payload = {} } = request;
  const activeOpen = E_USER_CONFIG.activeOpen;
  let bgmHost = E_USER_CONFIG.domain as string;
  if (E_USER_CONFIG.useHttps) {
    bgmHost = `https://${bgmHost}`;
  } else {
    bgmHost = `http://${bgmHost}`;
  }
  switch (request.action) {
    case 'check_subject_exist':
      try {
        if (payload.subjectInfo) {
          const result = await checkSubjectExit(
            payload.subjectInfo,
            bgmHost,
            payload.type,
            payload.disableDate
          );
          console.info('search results: ', result);
          if (result && result.url) {
            await browser.tabs.create({
              url: bgmHost + result.url,
              active: activeOpen,
            });
            setVal('subjectId', getSubjectId(result.url));
          } else {
            payload.auxSite && (await updateAuxData(payload.auxSite));
            createNewSubjectTab(payload.type, bgmHost, activeOpen);
          }
        } else {
          createNewSubjectTab(payload.type, bgmHost, activeOpen);
        }
      } catch (e) {
        /* handle error */
        console.log('fetch info err:', e, e.message);
      }
      break;
    case 'create_new_subject':
      payload.auxSite && (await updateAuxData(payload.auxSite));
      createNewSubjectTab(payload.type, bgmHost, activeOpen);
      break;
    case 'create_new_character':
      browser.tabs.create({
        url: `${bgmHost}/character/new`,
        active: activeOpen,
      });
      break;
    case 'fetch_data_bg':
      let resData = '';
      if (payload.type == 'img') {
        resData = await getImageDataByURL(payload.url);
      } else if (payload.type == 'html') {
        resData = await fetchText(payload.url);
      }
      return resData;
    default:
  }
}

function createNewSubjectTab(
  type: SubjectTypeId,
  bgmHost: string,
  active: boolean
) {
  let url = `${bgmHost}/new_subject/${type}`;
  browser.tabs.create({
    url,
    active,
  });
}

async function updateAuxData(payload: {
  url: string;
  opts?: IFetchOpts;
  prefs?: IAuxPrefs;
}) {
  const {
    url: auxSite,
    opts: auxSiteOpts = {},
    prefs: auxPrefs = {},
  } = payload;
  try {
    console.info('the start of updating aux data');
    const auxData = await getWikiDataByURL(auxSite, auxSiteOpts);
    const obj = await browser.storage.local.get(['wikiData']);
    console.info('current wikiData: ', obj.wikiData);
    console.info('auxiliary data: ', auxData);
    const { wikiData } = obj;
    let infos = combineInfoList(wikiData.infos, auxData, auxPrefs);
    if (auxSite.match(/store\.steampowered\.com/)) {
      infos = combineInfoList(auxData, wikiData.infos);
    }
    await browser.storage.local.set({
      wikiData: {
        type: wikiData.type,
        subtype: wikiData.subType || 0,
        infos,
      },
    });
    console.info('the end of updating aux data');
  } catch (e) {
    console.error(e);
  }
}

async function init() {
  // 初始化设置
  const obj = await browser.storage.local.get(['version', 'config']);
  if ((obj && !obj.version) || obj.version !== VERSION) {
    // await browser.storage.local.clear();
    await browser.storage.local.set({
      version: VERSION,
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
}

init();
