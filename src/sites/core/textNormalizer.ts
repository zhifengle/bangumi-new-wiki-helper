import { IPipeArgsDict, dealTextByPipe } from '../../utils/textPipe';
import type { TextPattern } from '../../interface/textPattern';

const preservedCategories = new Set([
  'subject_title',
  'subject_summary',
  'alias',
  'crt_name',
  'crt_summary',
]);

export function createKeywordPipeArgsDict(
  keyWords: TextPattern[] = []
): IPipeArgsDict {
  return keyWords.length
    ? {
        k: [keyWords],
      }
    : {};
}

export function normalizePreservedText(str: string): string {
  return dealTextByPipe(str, ['t']);
}

export function normalizeInfoText(
  str: string,
  keyWords: TextPattern[] = []
): string {
  return dealTextByPipe(
    str,
    ['p', 'k', 'label', 't'],
    createKeywordPipeArgsDict(keyWords)
  );
}

export function normalizeTextByCategory(
  str: string,
  category: string = '',
  keyWords: TextPattern[] = []
): string {
  if (preservedCategories.has(category)) {
    return normalizePreservedText(str);
  }
  return normalizeInfoText(str, keyWords);
}
