import { SubjectWikiInfo } from '../interface/subject';
import { SiteConfig } from '../interface/wiki';
import { insertControlBtnChara } from '../sites/common';
import { getchuTools } from '../sites/getchu';
import { $qa, findElement } from '../utils/domUtils';
import { SourceRuntimeAdapter } from './runtime';

export function initGetchuCharacter(
  siteConfig: SiteConfig,
  runtime: SourceRuntimeAdapter
) {
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
      await runtime.submitCharacterCreation({
        siteConfig,
        charaData,
      });
    });
  });
}
