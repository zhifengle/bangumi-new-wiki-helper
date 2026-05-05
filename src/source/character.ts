import { getStringValue, SubjectWikiInfo } from '../interface/subjectInfo';
import type {
  CharacterSourceDefinition,
  SubjectSourceDefinition,
} from '../interface/wiki';
import { getCharacterModels } from '../sites';
import { addCharaUI, insertControlBtnChara } from '../sites/core/controls';
import { createWikiExtractContext } from '../sites/core/context';
import { getCharaData } from '../sites/core/extract';
import { locateSource } from '../sites/core/extraction';
import { SourceRuntimeAdapter } from './runtime';

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
  const presenceSource = characterModel.presenceSource;
  if (presenceSource && !locateSource(presenceSource, { site: siteConfig.key })) return;

  const itemSourceResult = locateSource(characterModel.itemSource, {
    site: siteConfig.key,
  });
  const itemArr = Array.isArray(itemSourceResult)
    ? itemSourceResult
    : itemSourceResult
      ? [itemSourceResult]
      : [];
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

  const toolbarSource = characterModel.toolbarSource;
  if (!toolbarSource) return;
  const toolbarResult = locateSource(toolbarSource, { site: siteConfig.key });
  const $toolbarEl = Array.isArray(toolbarResult) ? toolbarResult[0] : toolbarResult;
  if (!$toolbarEl) return;

  const nameConfig = characterModel.itemList.find(
    (item) => item.emit?.category == 'crt_name'
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
  const $page = locateSource(siteConfig.pageSource, { site: siteConfig.key });
  if (!$page) return;
  const characterModels = getCharacterModels(siteConfig.key);
  if (!characterModels.length) return;

  for (const characterModel of characterModels) {
    await initCharacterModel(siteConfig, runtime, characterModel);
  }
}


