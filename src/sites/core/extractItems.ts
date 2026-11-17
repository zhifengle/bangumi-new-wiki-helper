import type { SingleInfo } from '../../interface/subjectInfo';
import type { InfoConfig, ModelKey } from '../../interface/wiki';
import {
  createSelectorCheck,
  resolveSelectorMatch,
  getSelectorKeyWords,
} from './selector';
import type { SelectorCheck } from './selector';
import { extractItemValue } from './readValue';
import type { WikiExtractContext } from './context';

function isSingleInfo(info: SingleInfo | undefined): info is SingleInfo {
  return Boolean(info);
}

export async function getWikiItem(
  infoConfig: InfoConfig,
  site: ModelKey,
  context: WikiExtractContext = {},
  check?: SelectorCheck
): Promise<SingleInfo | undefined> {
  if (!infoConfig) return;
  const match = resolveSelectorMatch(
    infoConfig.selector,
    context.root,
    check?.attempts
  );
  if (!match) return;

  const keyWords = getSelectorKeyWords(match.selector);
  const val = await extractItemValue(
    infoConfig,
    site,
    context,
    match.element,
    keyWords
  );
  if (check) check.result = val ? 'matched' : 'empty';
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
  site: ModelKey,
  context: WikiExtractContext
): Promise<SingleInfo[]> {
  const report = context.reportSelectorCheck;
  const checks = report && itemList.map((item) =>
    createSelectorCheck(item?.name ?? '', context.root)
  );
  const results = await Promise.allSettled(
    itemList.map((item, index) =>
      getWikiItem(item, site, context, checks?.[index])
    )
  );

  return results.flatMap((result, index) => {
    const check = checks?.[index];
    if (check && report) {
      if (result.status === 'rejected') {
        check.result = 'error';
        check.error = String(result.reason).slice(0, 300);
      }
      report(check);
    }
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
