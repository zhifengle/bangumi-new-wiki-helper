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
import { extractFields } from './extraction';

export { locateSource } from './extraction';

export async function getWikiData(
  siteConfig: SubjectSourceDefinition,
  context: WikiExtractContext = {}
) {
  const rawInfo = await extractFields(siteConfig.itemList, {
    ...context,
    site: siteConfig.key,
  });
  const hookRes = await getSubjectHooks(siteConfig, 'finalize')(rawInfo, {
    ...context,
    kind: 'subject',
    site: siteConfig.key,
  });
  return [...hookRes, ...(siteConfig.defaults || [])];
}

export async function getCharaData(
  model: CharacterSourceDefinition,
  context: WikiExtractContext = {}
) {
  const rawInfo = await extractFields(model.itemList, {
    ...context,
    site: model.siteKey,
  });
  const hookRes = await getCharacterHooks(model, 'finalize')(rawInfo, {
    ...context,
    kind: 'character',
    site: model.siteKey,
    root: context.root!,
  });
  return [...hookRes, ...(model.defaults || [])];
}
