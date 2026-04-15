import type { InfoConfig, SubjectModelKey } from '../../interface/wiki';
import type { TextPattern } from '../../interface/textPattern';
import { dealTextByPipe } from '../../utils/textPipe';
import { dealFuncByCategory } from '../catalog';
import { createKeywordPipeArgsDict, normalizeTextByCategory } from './textNormalizer';

/**
 * 处理单项 wiki 信息
 */
export function dealItemText(
  str: string,
  category: string = '',
  keyWords: TextPattern[] = []
): string {
  return normalizeTextByCategory(str, category, keyWords);
}

export function isSummaryCategory(category: string): boolean {
  return category === 'subject_summary' || category === 'crt_summary';
}

export function transformTextValue(
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
