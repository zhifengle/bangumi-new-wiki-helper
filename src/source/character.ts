import { getStringValue, SubjectWikiInfo } from '../interface/subjectInfo';
import type {
  CharacterSourceDefinition,
  InfoConfig,
  SelectorInput,
  SubjectSourceDefinition,
} from '../interface/wiki';
import { getCharacterModels } from '../sites';
import { addCharaUI, insertControlBtnChara } from '../sites/core/controls';
import { createWikiExtractContext } from '../sites/core/context';
import { getCharaData } from '../sites/core/extract';
import { findAllElement, findElement } from '../utils/domUtils';
import { SourceRuntimeAdapter } from './runtime';

function getIframeSelector(itemSelector: SelectorInput): string {
  if (itemSelector instanceof Array) {
    return itemSelector.find((item) => item.isIframe === true)?.selector || '';
  }
  return itemSelector.isIframe ? itemSelector.selector : '';
}

async function getIframeDoc(
  itemSelector: SelectorInput,
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

async function initCharacterModel(
  siteConfig: SubjectSourceDefinition,
  runtime: SourceRuntimeAdapter,
  characterModel: CharacterSourceDefinition
) {
  const presenceSelector = characterModel.presenceSelector;
  if (presenceSelector && !findElement(presenceSelector)) return;

  const iframeDoc = getIframeSelector(characterModel.itemSelector)
    ? await getIframeDoc(characterModel.itemSelector, runtime)
    : null;
  const itemArr = iframeDoc
    ? findAllElement(characterModel.itemSelector, iframeDoc)
    : findAllElement(characterModel.itemSelector);
  if (!itemArr.length) return;

  if ((characterModel.controlMode ?? 'select') === 'inline') {
    itemArr.forEach(($target) => {
      insertControlBtnChara($target, async () => {
        const charaInfo = await getCharaData(
          characterModel,
          createWikiExtractContext($target)
        );
        await submitCharacter(siteConfig, runtime, charaInfo);
      });
    });
    return;
  }

  const toolbarSelector = characterModel.toolbarSelector;
  if (!toolbarSelector) return;
  const $toolbarEl = findElement(toolbarSelector);
  if (!$toolbarEl) return;

  const nameConfig: InfoConfig = characterModel.itemList.find(
    (item) => item.category == 'crt_name'
  );
  if (!nameConfig) return;
  const names = await Promise.all(
    itemArr.map(async ($target) => {
      const infos = await getCharaData(
        {
          ...characterModel,
          itemList: [nameConfig],
        },
        createWikiExtractContext($target)
      );
      return getStringValue(
        infos.find((item) => item.category === 'crt_name')?.value
      );
    })
  );
  addCharaUI($toolbarEl, names, async (_e: Event, selectedName: string) => {
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
      const charaInfo = await getCharaData(
        characterModel,
        createWikiExtractContext($target)
      );
      await submitCharacter(siteConfig, runtime, charaInfo);
    }
  });
}

export async function initSourceCharacter(
  siteConfig: SubjectSourceDefinition,
  runtime: SourceRuntimeAdapter
) {
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  const characterModels = getCharacterModels(siteConfig.key);
  if (!characterModels.length) return;

  for (const characterModel of characterModels) {
    await initCharacterModel(siteConfig, runtime, characterModel);
  }
}


