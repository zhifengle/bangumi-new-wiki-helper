import type { SingleInfo } from '../../interface/subjectInfo';
import type { InfoConfig, SubjectModelKey } from '../../interface/wiki';
import { resolveSelectorMatch, getSelectorKeyWords } from './selector';
import { extractItemValue } from './readValue';
import type { WikiExtractContext } from './context';

function isSingleInfo(info: SingleInfo | undefined): info is SingleInfo {
  return Boolean(info);
}

export async function getWikiItem(
  infoConfig: InfoConfig,
  site: SubjectModelKey,
  context: WikiExtractContext = {}
): Promise<SingleInfo | undefined> {
  if (!infoConfig) return;
  const match = resolveSelectorMatch(infoConfig.selector, context.root);
  if (!match) return;

  const keyWords = getSelectorKeyWords(match.selector);
  const val = await extractItemValue(
    infoConfig,
    site,
    context,
    match.element,
    keyWords
  );
  if (val) {
    return {
      name: infoConfig.name,
      value: val,
      category: infoConfig.category,
    } as SingleInfo;
  }
}

export async function getWikiItems(
  itemList: InfoConfig[],
  site: SubjectModelKey,
  context: WikiExtractContext
): Promise<SingleInfo[]> {
  const results = await Promise.allSettled(
    itemList.map((item) => getWikiItem(item, site, context))
  );

  return results.flatMap((result, index) => {
    if (result.status === 'fulfilled') {
      return isSingleInfo(result.value) ? [result.value] : [];
    }
    console.error(
      `[extract] failed to get wiki item: ${itemList[index]?.name}`,
      result.reason
    );
    return [];
  });
}
