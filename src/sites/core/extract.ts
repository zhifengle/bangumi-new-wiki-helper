import type { SingleInfo } from '../../interface/subjectInfo';
import type {
  CharacterSourceDefinition,
  SubjectSourceDefinition,
} from '../../interface/wiki';
import {
  getCharacterHooks,
  getSubjectHooks,
} from '../catalog';
import type { WikiExtractContext } from './context';
import { getWikiItems } from './extractItems';

export { dealItemText } from './transform';

function applyHookResult(
  rawInfo: SingleInfo[],
  hookRes: unknown
): SingleInfo[] {
  return Array.isArray(hookRes) ? hookRes : rawInfo;
}

export async function getWikiData(
  siteConfig: SubjectSourceDefinition,
  context: WikiExtractContext = {}
) {
  const rawInfo = await getWikiItems(siteConfig.itemList, siteConfig.key, context);
  const defaultInfos = siteConfig.defaultInfos || [];
  const hookRes = await getSubjectHooks(siteConfig, 'afterGetWikiData')(
    rawInfo,
    siteConfig
  );
  return [...applyHookResult(rawInfo, hookRes), ...defaultInfos];
}

export async function getCharaData(
  model: CharacterSourceDefinition,
  context: WikiExtractContext = {}
) {
  const rawInfo = await getWikiItems(model.itemList, model.siteKey, context);
  const defaultInfos = model.defaultInfos || [];
  const hookRes = await getCharacterHooks(model, 'afterGetWikiData')(
    rawInfo,
    model,
    context.root
  );
  return [...applyHookResult(rawInfo, hookRes), ...defaultInfos];
}
