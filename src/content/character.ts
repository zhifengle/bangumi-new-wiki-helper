import { SingleInfo, SubjectWikiInfo } from '../interface/subject';
import { SiteConfig } from '../interface/wiki';
import { insertControlBtnChara } from '../sites/common';
import { $qa, findElement } from '../utils/domUtils';

export async function initChara(siteConfig: SiteConfig) {
  // 查找标志性的元素
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  let controlSelector = '';
  Array.prototype.forEach.call($qa(controlSelector), (node: HTMLElement) => {
    insertControlBtnChara(node, async (e: Event) => {
      // const charaInfo = getchuTools.getCharacterInfo(e.target as HTMLElement);
      // @TODO
      const charaInfo: SingleInfo[] = [];
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
}
