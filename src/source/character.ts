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
import type { ReportSelectorCheck } from '../sites/core/selector';
import { findAllElement, findElement } from '../utils/domUtils';
import {
  buildExportPayload,
  openDebugSource,
  registerDebugSource,
} from './export';
import type { DebugSource } from './export';
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

async function buildCharacterPayload(
  siteConfig: SubjectSourceDefinition,
  runtime: SourceRuntimeAdapter,
  charaInfo: SubjectWikiInfo['infos']
) {
  const charaData = await collectCharacterData(siteConfig, runtime, charaInfo);
  if (!charaData) throw new Error('没有提取到角色信息。');
  return buildExportPayload({
    kind: 'character',
    site: siteConfig.key,
    sourceUrl: location.href,
    data: charaData,
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

  const extractCharacter = (
    $target: Element,
    reportSelectorCheck?: ReportSelectorCheck
  ) => getCharaData(characterModel, { root: $target, reportSelectorCheck });

  if ((characterModel.controlMode ?? 'select') === 'inline') {
    itemArr.forEach(($target, index) => {
      const $controls = insertControlBtnChara($target, async () => {
        await submitCharacter(siteConfig, runtime, await extractCharacter($target));
      });
      if (!$controls) return;
      const debugSource: DebugSource = {
        id: `character:${characterModel.key}:${index}`,
        label: `角色 ${index + 1} · ${characterModel.description}`,
        collect: async (report) =>
          buildCharacterPayload(
            siteConfig,
            runtime,
            await extractCharacter($target, report)
          ),
      };
      registerDebugSource(debugSource);
      appendExportBtn($controls, () => openDebugSource(debugSource));
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
  const debugSource: DebugSource = {
    id: `character:${characterModel.key}:selected`,
    label: `角色（当前选择）· ${characterModel.description}`,
    collect: async (report) => {
      const [$target] = resolveTargets($select.value);
      if (!$target) throw new Error('没有找到当前选择的角色。');
      return buildCharacterPayload(
        siteConfig,
        runtime,
        await extractCharacter($target, report)
      );
    },
  };
  registerDebugSource(debugSource);
  appendExportBtn($ui, () => openDebugSource(debugSource));
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


