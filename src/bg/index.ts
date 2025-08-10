import browser from 'webextension-polyfill';
import { BangumiDomain, checkSubjectExit } from '../sites/bangumi';
import { SubjectTypeId } from '../interface/wiki';
import { getWikiDataByURL, combineInfoList } from '../sites/common';
import { setVal } from './utils';
import { getSubjectId } from '../sites/bangumi/common';
import { getImageDataByURL } from '../utils/dealImage';
import { fetchText } from '../utils/fetchData';
import { ExtMsg, IAuxPrefs, IFetchOpts, LogMsg } from '../interface/types';
import { genAnonymousLinkText } from '../utils/domUtils';
// import { version as VERSION } from "../../extension/manifest.json";

const VERSION = '0.3.0';

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
      if (payload.subjectInfo) {
        sendMsgToCurrentTab({
          type: 'info',
          message: `搜索中...<br/>${payload?.subjectInfo?.name ?? ''}`,
          duration: 0,
        });
        let result: any = undefined;
        try {
          result = await checkSubjectExit(
            payload.subjectInfo,
            bgmHost,
            payload.type,
            payload.disableDate
          );
          console.info('search results: ', result);
          sendMsgToCurrentTab({
            type: 'info',
            message: '',
            cmd: 'dismissNotError',
          });
        } catch (e) {
          console.log('fetch info err:', e, e.message);
          sendMsgToCurrentTab({
            type: 'error',
            message: `Bangumi 搜索匹配结果为空: <br/><b>${
              payload?.subjectInfo?.name ?? ''
            }</b>`,
            cmd: 'dismissNotError',
          });
        }
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
        resData = await getImageDataByURL(payload.url, {
          headers: payload.headers,
        });
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
    sendMsgToCurrentTab({
      type: 'info',
      message: `抓取第三方网站信息中:<br/>${auxSite}`,
      duration: 0,
    });
    console.info('the start of updating aux data');
    window._fetch_url_bg = auxSite;
    const auxData = await getWikiDataByURL(auxSite, auxSiteOpts);
    window._fetch_url_bg = null;
    const obj: any = await browser.storage.local.get(['wikiData']);
    console.info('current wikiData: ', obj.wikiData);
    if (!auxData || (auxData && auxData.length === 0)) {
      sendMsgToCurrentTab({
        type: 'error',
        message: `抓取信息为空<br/>
      ${genAnonymousLinkText(auxSite, auxSite)}
      <br/>
      打开上面链接确认是否能访问以及有信息，再尝试`,
        cmd: 'dismissNotError',
      });
    } else {
      sendMsgToCurrentTab({
        type: 'info',
        message: `抓取第三方网站信息成功:<br/>${genAnonymousLinkText(
          auxSite,
          auxSite
        )}`,
        cmd: 'dismissNotError',
      });
    }
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
    sendMsgToCurrentTab({
      type: 'error',
      message: `抓取信息失败<br/>
      ${genAnonymousLinkText(auxSite, auxSite)}
      <br/>
      打开上面链接确认是否能访问以及有信息，再尝试`,
      cmd: 'dismissNotError',
    });
  }
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
      // urls: ['http://*/brandnew/*'],
      urls: ['http://www.getchu.com/brandnew/*'],
    },
    createHeaderListener('requestHeaders')
  );
}

init();
