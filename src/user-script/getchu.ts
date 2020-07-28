import { SiteConfig } from '../interface/wiki';
import { $qa, findElement } from '../utils/domUtils';
import { insertControlBtnChara } from '../sites/common';
import { getchuTools } from '../sites/getchu';
import { SingleInfo, SubjectWikiInfo } from '../interface/subject';
import {
  BGM_DOMAIN,
  CHARA_DATA,
  PROTOCOL,
  AUTO_FILL_FORM,
} from './constraints';

export const getchu = {
  init(siteConfig: SiteConfig) {
    // 查找标志性的元素
    const $page = findElement(siteConfig.pageSelectors);
    if (!$page) return;
    const protocol = GM_getValue(PROTOCOL) || 'https';
    const bgm_domain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
    const bgmHost = `${protocol}://${bgm_domain}`;

    Array.prototype.forEach.call($qa('h2.chara-name'), (node: HTMLElement) => {
      insertControlBtnChara(node.parentElement, async (e: Event) => {
        const charaInfo = getchuTools.getCharacterInfo(e.target as HTMLElement);
        console.info('character info list: ', charaInfo);
        const charaData: SubjectWikiInfo = {
          type: siteConfig.type,
          infos: charaInfo,
        };
        // 重置自动填表
        GM_setValue(AUTO_FILL_FORM, 1);
        GM_setValue(CHARA_DATA, JSON.stringify(charaData));
        // @TODO 不使用定时器
        setTimeout(() => {
          GM_openInTab(`${bgmHost}/character/new`);
        }, 200);
      });
    });
  },
};
