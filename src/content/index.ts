// @ts-ignore
import browser from 'webextension-polyfill';
import { SiteConfig } from '../interface/wiki';
import { findElement } from '../utils/domUtils';
import { getQueryInfo, getWikiData, insertControlBtn } from '../sites/common';
import { SingleInfo, SubjectWikiInfo } from '../interface/subject';
import { findModelByHost } from '../models';
import { getHooks } from '../sites';

async function initCommon(siteConfig: SiteConfig) {
  // 查找标志性的元素
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  const $title = findElement(siteConfig.controlSelector);
  if (!$title) return;
  let bcRes = await getHooks(siteConfig, 'beforeCreate')();
  if (!bcRes) return;
  if (bcRes === true) {
    bcRes = {};
  }
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
        ...bcRes?.payload,
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
          ...bcRes?.payload,
        },
      });
    }
  });
}

const init = function () {
  const modelArr = findModelByHost(document.location.host);
  if (modelArr && modelArr.length) {
    modelArr.forEach((m) => {
      console.info(m.description, ' content script init');
      initCommon(m);
    });
  }
};
init();
