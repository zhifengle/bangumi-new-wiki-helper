import { browser } from 'webextension-polyfill-ts';
import { SiteConfig } from '../interface/wiki';
import { findElement } from '../utils/domUtils';
import { getQueryInfo, getWikiData, insertControlBtn } from '../sites/common';
import { SingleInfo, SubjectWikiInfo } from '../interface/subject';
import { findModelByHost } from '../models';
import { getHooks } from '../sites';
import { getchu } from './getchu';
import { getchuGameModel } from '../models/getchuGame';
import { initChara } from './character';
import { IMsgPayload } from '../interface/types';

async function fetchCover(infoList: SingleInfo[]) {
  // 封面有 url 但是获取失败。尝试使用 background 获取
  for (let i = 0; i < infoList.length; i++) {
    const info = infoList[i];
    if (info.category == 'cover') {
      const dataUrl = info?.value?.dataUrl || '';
      const url = info?.value?.url || '';
      if (!/^data:image/.test(dataUrl) && url) {
        console.log('fetch cover by background');
        const dataUrl = await browser.runtime.sendMessage({
          action: 'fetch_data_bg',
          payload: {
            type: 'img',
            url: url,
          },
        });
        if (dataUrl) {
          info.value = {
            url,
            dataUrl,
          };
        }
      }
    }
  }
}

async function initCommon(siteConfig: SiteConfig) {
  // 查找标志性的元素
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  const $title = findElement(siteConfig.controlSelector);
  if (!$title) return;
  let bcRes: boolean | { payload?: IMsgPayload } = await getHooks(
    siteConfig,
    'beforeCreate'
  )(siteConfig);
  if (!bcRes) return;
  if (bcRes === true) {
    bcRes = {};
  }
  const { payload = {} } = bcRes;
  console.info(siteConfig.description, ' content script init');
  insertControlBtn($title, async (e, flag) => {
    console.info('init');
    const infoList: (SingleInfo | void)[] = await getWikiData(siteConfig);
    await fetchCover(infoList as SingleInfo[]);
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
      let msgPayload: any = {
        subjectInfo: getQueryInfo(infoList as SingleInfo[]),
        type: siteConfig.type,
        ...payload,
      };
      await browser.runtime.sendMessage({
        action: 'check_subject_exist',
        payload: msgPayload,
      });
    } else {
      await browser.runtime.sendMessage({
        action: 'create_new_subject',
        payload: {
          type: siteConfig.type,
          ...payload,
        },
      });
    }
  });
}

const init = function () {
  const modelArr = findModelByHost(window.location.hostname);
  if (modelArr && modelArr.length) {
    modelArr.forEach((m) => {
      initCommon(m);
      initChara(m);
    });
  }
  // @TODO remove check
  if (location.hostname === 'www.getchu.com') {
    getchu.init(getchuGameModel);
  }
};
init();
