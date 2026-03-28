import { getStringValue, SubjectWikiInfo } from '../interface/subjectInfo';
import { InfoConfig, Selector, SubjectSourceDefinition } from '../interface/wiki';
import { getCharaModel } from '../sites';
import { addCharaUI, insertControlBtnChara } from '../sites/core/controls';
import { getCharaData } from '../sites/core/extract';
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

function hasIframeItemSelector(itemSelector: Selector | Selector[]) {
  return Boolean(getIframeSelector(itemSelector));
}

async function submitCharacter(
  siteConfig: SubjectSourceDefinition,
  runtime: SourceRuntimeAdapter,
  charaInfo: SubjectWikiInfo['infos']
) {
  if (!charaInfo.length) return;
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

export async function initSourceCharacter(
  siteConfig: SubjectSourceDefinition,
  runtime: SourceRuntimeAdapter
) {
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  const charaModel = getCharaModel(siteConfig.key);
  if (!charaModel) return;
  const $controlEl = findElement(charaModel.controlSelector);
  if (!$controlEl) return;
  const iframeDoc = hasIframeItemSelector(charaModel.itemSelector)
    ? await getIframeDoc(charaModel.itemSelector, runtime)
    : null;
  const itemArr = iframeDoc
    ? findAllElement(charaModel.itemSelector, iframeDoc)
    : findAllElement(charaModel.itemSelector);
  if (!itemArr.length) return;
  if (charaModel.controlMode === 'inline') {
    itemArr.forEach(($target) => {
      insertControlBtnChara($target, async () => {
        const charaInfo = await getCharaData(charaModel, $target);
        await submitCharacter(siteConfig, runtime, charaInfo);
      });
    });
    return;
  }
  const nameConfig: InfoConfig = charaModel.itemList.find(
    (item) => item.category == 'crt_name'
  );
  if (!nameConfig) return;
  const names = await Promise.all(
    itemArr.map(async ($target) => {
      const infos = await getCharaData(
        {
          ...charaModel,
          itemList: [nameConfig],
        },
        $target
      );
      return getStringValue(
        infos.find((item) => item.category === 'crt_name')?.value
      );
    })
  );
  addCharaUI($controlEl, names, async (_e: Event, selectedName: string) => {
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
      await submitCharacter(siteConfig, runtime, charaInfo);
    }
  });
}


