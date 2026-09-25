import { getStringValue, SubjectWikiInfo } from '../interface/subjectInfo';
import type {
  CharacterSourceDefinition,
  InfoConfig,
  SelectorInput,
  SubjectSourceDefinition,
} from '../interface/wiki';
import { getCharacterModels } from '../sites';
import {
  addCharaUI,
  appendExportBtn,
  insertControlBtnChara,
} from '../sites/core/controls';
import { createWikiExtractContext } from '../sites/core/context';
import { getCharaData } from '../sites/core/extract';
import { findAllElement, findElement } from '../utils/domUtils';
import { buildExportPayload, showExportDialog } from './export';
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

async function collectCharacterData(
  siteConfig: SubjectSourceDefinition,
  runtime: SourceRuntimeAdapter,
  charaInfo: SubjectWikiInfo['infos']
): Promise<SubjectWikiInfo | null> {
  if (!charaInfo.length) return null;
  await runtime.hydrateCharacterCover?.(charaInfo);
  console.info('character info list: ', charaInfo);
  return {
    type: siteConfig.type,
    infos: charaInfo,
  };
}

async function submitCharacter(
  siteConfig: SubjectSourceDefinition,
  runtime: SourceRuntimeAdapter,
  charaInfo: SubjectWikiInfo['infos']
) {
  const charaData = await collectCharacterData(siteConfig, runtime, charaInfo);
  if (!charaData) return;
  await runtime.submitCharacterCreation({
    siteConfig,
    charaData,
  });
}

async function exportCharacter(
  siteConfig: SubjectSourceDefinition,
  runtime: SourceRuntimeAdapter,
  charaInfo: SubjectWikiInfo['infos']
) {
  const charaData = await collectCharacterData(siteConfig, runtime, charaInfo);
  if (!charaData) return;
  showExportDialog(
    buildExportPayload({
      kind: 'character',
      site: siteConfig.key,
      sourceUrl: location.href,
      data: charaData,
    })
  );
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

  const extractCharacter = ($target: Element) =>
    getCharaData(characterModel, createWikiExtractContext($target));

  if ((characterModel.controlMode ?? 'select') === 'inline') {
    itemArr.forEach(($target) => {
      const $controls = insertControlBtnChara($target, async () => {
        await submitCharacter(siteConfig, runtime, await extractCharacter($target));
      });
      if (!$controls) return;
      appendExportBtn($controls, async () => {
        await exportCharacter(siteConfig, runtime, await extractCharacter($target));
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
  const resolveTargets = (selectedName: string): Element[] => {
    if (selectedName === 'all') {
      // @TODO 一次性新建全部
      // return [...itemArr];
      return [];
    }
    const idx = names.indexOf(selectedName);
    return idx === -1 ? [] : itemArr.slice(idx, idx + 1);
  };
  const $ui = addCharaUI($toolbarEl, names, async (_e: Event, selectedName: string) => {
    for (const $target of resolveTargets(selectedName)) {
      await submitCharacter(siteConfig, runtime, await extractCharacter($target));
    }
  });
  const $select = $ui?.querySelector<HTMLSelectElement>('.e-bnwh-select');
  if (!$ui || !$select) return;
  appendExportBtn($ui, async () => {
    for (const $target of resolveTargets($select.value)) {
      await exportCharacter(siteConfig, runtime, await extractCharacter($target));
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


