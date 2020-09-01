// @ts-ignore
import browser from 'webextension-polyfill';
import {SiteConfig} from '../interface/wiki';
import {$qa, findElement} from '../utils/domUtils';
import {insertControlBtnChara} from '../sites/common';
import {getchuTools} from '../sites/getchu';
import {SubjectWikiInfo} from '../interface/subject';

export const getchu = {
  init(siteConfig: SiteConfig) {
    // 查找标志性的元素
    const $page = findElement(siteConfig.pageSelectors);
    if (!$page) return;
    Array.prototype.forEach.call($qa('h2.chara-name'), (node: HTMLElement) => {
      insertControlBtnChara(node, async (e: Event) => {
        const charaInfo = getchuTools.getCharacterInfo(e.target as HTMLElement);
        console.info('character info list: ', charaInfo);
        const charaData: SubjectWikiInfo = {
          type: siteConfig.type,
          infos: charaInfo,
        };
        await browser.storage.local.set({
          charaData,
        });
        await browser.runtime.sendMessage({
          action: 'create_new_character',
        });
      });
    });
  },
};
