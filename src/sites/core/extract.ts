import { getStringValue } from '../../interface/subjectInfo';
import type { SingleInfo } from '../../interface/subjectInfo';
import type {
  CharacterSourceDefinition,
  InfoConfig,
  Selector,
  SelectorInput,
  SubjectModelKey,
  SubjectSourceDefinition,
} from '../../interface/wiki';
import { findElement, getInnerText, getText } from '../../utils/domUtils';
import type { TextPattern } from '../../interface/textPattern';
import { dealTextByPipe } from '../../utils/textPipe';
import { toTextPatterns } from '../../utils/textPattern';
import { dealFuncByCategory, getCharaHooks, getHooks } from '../catalog';
import { getCover } from './cover';
import type { WikiExtractContext, WikiExtractRoot } from './context';
import {
  createKeywordPipeArgsDict,
  normalizeTextByCategory,
} from './textNormalizer';

/**
 * 处理单项 wiki 信息
 * @param str
 * @param category
 * @param keyWords
 */
export function dealItemText(
  str: string,
  category: string = '',
  keyWords: TextPattern[] = []
): string {
  return normalizeTextByCategory(str, category, keyWords);
}

type SelectorMatch = {
  element: Element;
  selector: Selector;
};

function resolveSelectorMatch(
  selector: SelectorInput,
  root?: WikiExtractRoot
): SelectorMatch | undefined {
  if (selector instanceof Array) {
    for (const candidate of selector) {
      const match = resolveSelectorMatch(candidate, root);
      if (match) {
        return match;
      }
    }
    return;
  }

  const element = findElement(selector, root);
  if (!element) {
    return;
  }

  return {
    element,
    selector,
  };
}

function getSelectorKeyWords(selector: Selector): TextPattern[] {
  return toTextPatterns(selector.keyWord);
}

function isCoverCategory(category: string): boolean {
  return category === 'cover' || category === 'crt_cover';
}

function isSummaryCategory(category: string): boolean {
  return category === 'subject_summary' || category === 'crt_summary';
}

function shouldUseInnerText(category: string, infoConfig: InfoConfig): boolean {
  return isSummaryCategory(category) || Boolean(infoConfig.pipes?.includes('ti'));
}

function readRawText(
  element: Element,
  category: string,
  infoConfig: InfoConfig
): string {
  const target = element as HTMLElement;
  if (shouldUseInnerText(category, infoConfig)) {
    const innerText = getInnerText(target);
    if (innerText || infoConfig.pipes?.includes('ti')) {
      return innerText;
    }
  }
  return getText(target);
}

function transformTextValue(
  rawText: string,
  infoConfig: InfoConfig,
  site: SubjectModelKey,
  category: string,
  keyWords: TextPattern[]
): string {
  const pipeArgsDict = createKeywordPipeArgsDict(keyWords);
  if (infoConfig.pipes?.length) {
    return dealTextByPipe(rawText, infoConfig.pipes, pipeArgsDict);
  }
  const normalizedText = normalizeTextByCategory(rawText, category, keyWords);
  if (category === 'date') {
    return dealFuncByCategory(site, category)(normalizedText);
  }
  if (
    category === 'subject_title' ||
    category === 'alias' ||
    isSummaryCategory(category)
  ) {
    return dealFuncByCategory(site, category)(normalizedText);
  }
  return normalizedText;
}

function postProcessValue(
  category: string,
  value: SingleInfo['value'] | undefined
): SingleInfo['value'] | undefined {
  if (category === 'creator') {
    return dealTextByPipe(getStringValue(value), ['ta']);
  }
  return value;
}

async function extractItemValue(
  infoConfig: InfoConfig,
  site: SubjectModelKey,
  context: WikiExtractContext,
  element: Element,
  keyWords: TextPattern[]
): Promise<SingleInfo['value'] | undefined> {
  const category = infoConfig.category || '';
  if (isCoverCategory(category)) {
    return getCover(element, site, context);
  }
  if (category === 'website') {
    return dealFuncByCategory(site, 'website')(element.getAttribute('href'));
  }

  const rawText = readRawText(element, category, infoConfig);
  const value = transformTextValue(
    rawText,
    infoConfig,
    site,
    category,
    keyWords
  );
  return postProcessValue(category, value);
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

function isSingleInfo(info: SingleInfo | undefined): info is SingleInfo {
  return Boolean(info);
}

async function getWikiItems(
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
  const hookRes = await getHooks(siteConfig, 'afterGetWikiData')(
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
  const hookRes = await getCharaHooks(model, 'afterGetWikiData')(
    rawInfo,
    model,
    context.root
  );
  return [...applyHookResult(rawInfo, hookRes), ...defaultInfos];
}


