import { getStringValue } from '../../interface/subjectInfo';
import type { SingleInfo } from '../../interface/subjectInfo';
import type { InfoConfig, SubjectModelKey } from '../../interface/wiki';
import { getInnerText, getText } from '../../utils/domUtils';
import type { TextPattern } from '../../interface/textPattern';
import { dealTextByPipe } from '../../utils/textPipe';
import { dealFuncByCategory } from '../catalog';
import { getCover } from './cover';
import type { WikiExtractContext } from './context';
import { transformTextValue, isSummaryCategory } from './transform';

function isCoverCategory(category: string): boolean {
  return category === 'cover' || category === 'crt_cover';
}

function shouldUseInnerText(category: string, infoConfig: InfoConfig): boolean {
  return isSummaryCategory(category) || Boolean(infoConfig.pipes?.includes('ti'));
}

export function readRawText(
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

export function postProcessValue(
  category: string,
  value: SingleInfo['value'] | undefined
): SingleInfo['value'] | undefined {
  if (category === 'creator') {
    return dealTextByPipe(getStringValue(value), ['ta']);
  }
  return value;
}

export async function extractItemValue(
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
  const value = transformTextValue(rawText, infoConfig, site, category, keyWords);
  return postProcessValue(category, value);
}
