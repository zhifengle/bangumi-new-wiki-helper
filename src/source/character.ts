import { SubjectWikiInfo } from '../interface/subject';
import { InfoConfig, Selector, SiteConfig } from '../interface/wiki';
import { getCharaModel } from '../models';
import { addCharaUI, getCharaData } from '../sites/common';
import { findAllElement, findElement } from '../utils/domUtils';
import { SourceRuntimeAdapter } from './runtime';

function getIframeSelector(itemSelector: Selector | Selector[]): string {
  if (itemSelector instanceof Array) {
    return itemSelector.find((item) => item.isIframe === true)?.selector || '';
  }
  return itemSelector.isIframe ? itemSelector.selector : '';
}

async function getIframeDoc(
  itemSelector: Selector | Selector[],
  runtime: SourceRuntimeAdapter
) {
  const iframeSel = getIframeSelector(itemSelector);
  if (!iframeSel) {
    return null;
  }
  const url = findElement({
    selector: iframeSel,
  })?.getAttribute('src');
  if (!url) {
    return null;
  }
  console.log('fetch html by runtime adapter');
  const rawHtml = await runtime.fetchHtml(url);
  return new DOMParser().parseFromString(rawHtml, 'text/html');
}

export async function initSourceCharacter(
  siteConfig: SiteConfig,
  runtime: SourceRuntimeAdapter
) {
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  const charaModel = getCharaModel(siteConfig.key);
  if (!charaModel) return;
  const $el = findElement(charaModel.controlSelector);
  if (!$el) return;
  const $doc = await getIframeDoc(charaModel.itemSelector, runtime);
  const itemArr = $doc
    ? findAllElement(charaModel.itemSelector, $doc as any)
    : findAllElement(charaModel.itemSelector);
  const nameConfig: InfoConfig = charaModel.itemList.find(
    (item) => item.category == 'crt_name'
  );
  const names = await Promise.all(
    itemArr.map(async ($target) => {
      const infos = await getCharaData(
        {
          ...charaModel,
          itemList: [nameConfig],
        },
        $target
      );
      return infos.find((item) => item.category === 'crt_name')?.value;
    })
  );
  addCharaUI($el, names, async (_e: Event, selectedName: string) => {
    let targetList: Element[] = [];
    if (selectedName === 'all') {
      // @TODO 一次性新建全部
      // targetList = [...itemArr];
    } else {
      const idx = names.indexOf(selectedName);
      if (idx !== -1) {
        targetList = itemArr.slice(idx, idx + 1);
      }
    }
    for (const $target of targetList) {
      const charaInfo = await getCharaData(charaModel, $target);
      await runtime.hydrateCharacterCover?.(charaInfo);
      console.info('character info list: ', charaInfo);
      const charaData: SubjectWikiInfo = {
        type: siteConfig.type,
        infos: charaInfo,
      };
      await runtime.submitCharacterCreation({
        siteConfig,
        charaData,
      });
    }
  });
}
