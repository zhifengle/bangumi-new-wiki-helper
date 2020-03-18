// @ts-ignore
import browser from 'webextension-polyfill';
import {SiteConfig} from "../interface/wiki";
import {findElement} from "../utils/domUtils";
import {
  getQueryInfo,
  getWikiItem,
  insertControlBtn
} from "../sites/common";
import {SingleInfo, SubjectWikiInfo} from "../interface/subject";
import {amazonSubjectModel} from "../models/amazonJpBook";
import {getchuGameModel} from "../models/getchuGame";

const getData = async (list: Promise<any>[]) => {
  return await Promise.all(list)
}

async function initCommon(siteConfig: SiteConfig, site: string, subtype = 0) {
  // 查找标志性的元素
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  const $title = findElement(siteConfig.controlSelector);
  if (!$title) return;
  insertControlBtn($title.parentElement, async (e, flag) => {
    console.info('init')
    // getWikiItem promise
    const rawList = await getData(siteConfig.itemList.map(item => getWikiItem(item, site)));
    const infoList: (SingleInfo | void)[] = rawList.filter(i => i)
    console.info('wiki info list: ', infoList)
    const wikiData: SubjectWikiInfo = {
      type: siteConfig.type,
      subtype,
      infos: infoList as SingleInfo[]
    }
    await browser.storage.local.set({
      wikiData
    });
    if (flag) {
      await browser.runtime.sendMessage({
        action: 'check_subject_exist',
        payload: {
          subjectInfo: getQueryInfo(infoList as SingleInfo[]),
          type: siteConfig.type
        }
      });
    } else {
      await browser.runtime.sendMessage({
        action: 'create_new_subject',
        payload: {
          type: siteConfig.type
        }
      });
    }
  });
}

const init = function () {
  const re = new RegExp([
    'getchu.com',
    'bangumi\\.tv', 'bgm\\.tv', 'chii\\.tv',
    'amazon\\.co\\.jp'
  ].join('|'));
  const page = document.location.host.match(re);
  if (page) {
    switch (page[0]) {
      case 'amazon.co.jp':
        initCommon(amazonSubjectModel, 'amazon_jp_book');
        break;
      case 'getchu.com':
        initCommon(getchuGameModel, 'getchu_game');
        break
      case 'bangumi.tv':
      case 'chii.tv':
      case 'bgm.tv':
        // bangumi.init();
        break;
      default:
      // bangumi.init();
    }
  }
};
init();
