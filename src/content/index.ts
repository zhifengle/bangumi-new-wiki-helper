// @ts-ignore
import browser from 'webextension-polyfill';
import { SiteConfig } from '../interface/wiki';
import { findElement } from '../utils/domUtils';
import { getQueryInfo, getWikiData, insertControlBtn } from '../sites/common';
import { SingleInfo, SubjectWikiInfo } from '../interface/subject';
import { amazonSubjectModel } from '../models/amazonJpBook';
import { getchuGameModel } from '../models/getchuGame';
import { getchu } from './getchu';
import { erogamescapeModel } from '../models/erogamescape';
import { configs, findModelByHost } from '../models';
import { steamdbModel } from '../models/steamdb';
import { steamModel } from '../models/steam';
import { getSteamURL, getSteamdbURL } from '../sites/steam';
import {
  searchCVByName,
  addPersonRelatedCV,
  addPersonRelatedSubject,
} from '../sites/bangumi/related';

async function initCommon(siteConfig: SiteConfig, config: any = {}) {
  // 查找标志性的元素
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  const $title = findElement(siteConfig.controlSelector);
  if (!$title) return;
  insertControlBtn($title, async (e, flag) => {
    console.info('init');
    const infoList: (SingleInfo | void)[] = await getWikiData(siteConfig);
    console.info('wiki info list: ', infoList);
    const wikiData: SubjectWikiInfo = {
      type: siteConfig.type,
      subtype: siteConfig.subType || 0,
      infos: infoList as SingleInfo[],
    };
    await browser.storage.local.set({
      wikiData,
    });
    if (flag) {
      let payload: any = {
        subjectInfo: getQueryInfo(infoList as SingleInfo[]),
        type: siteConfig.type,
        ...config?.payload,
      };
      await browser.runtime.sendMessage({
        action: 'check_subject_exist',
        payload,
      });
    } else {
      await browser.runtime.sendMessage({
        action: 'create_new_subject',
        payload: {
          type: siteConfig.type,
          ...config?.payload,
        },
      });
    }
  });
}

// common
const hostArr: string[] = [];
Object.keys(configs).forEach((key: string) =>
  hostArr.push(...configs[key].host)
);
const siteRe = new RegExp(
  [...hostArr, 'bangumi.tv', 'bgm.tv', 'chii.tv']
    .map((h) => h.replace('.', '\\.'))
    .join('|')
);
const init = function () {
  const page = document.location.host.match(siteRe);
  if (page) {
    console.info('content script init');
    switch (page[0]) {
      case 'amazon.co.jp':
        initCommon(amazonSubjectModel);
        break;
      case 'getchu.com':
        initCommon(getchuGameModel);
        getchu.init(getchuGameModel);
        break;
      case 'erogamescape.dyndns.org':
      case 'erogamescape.org':
        initCommon(erogamescapeModel);
        break;
      case 'steamdb.info':
        initCommon(steamdbModel, {
          payload: {
            disableDate: true,
            auxSite: getSteamURL(window.location.href),
          },
        });
        break;
      case 'store.steampowered.com':
        initCommon(steamModel, {
          payload: {
            disableDate: true,
            auxSite: getSteamdbURL(window.location.href),
          },
        });
        break;
      case 'bangumi.tv':
      case 'chii.tv':
      case 'bgm.tv':
        // bangumi.init();
        break;
      default:
        const model = findModelByHost(page[0]);
        if (model) {
          initCommon(model);
        }
    }
  }
};
init();

async function test() {
  console.log('test');
  // const id = await searchCVByName('民安ともえ');
  const id = await searchCVByName('葵時緒');
  console.log(id);
  // const r = await addPersonRelatedCV('311638', '78659', [id], 4);
  // const sub = await addPersonRelatedSubject(['311638'], '78659', 4, 2);
  // debugger;
}
if (location.href === 'https://bgm.tv/character/78659') {
  test();
}
