import type { SearchResult } from '../../interface/subjectInfo';
import { SubjectTypeId } from '../../interface/wiki';
import { normalizeSearchName } from './search';

type SubtitleBoundary = {
  mainTitle: string;
  spaced: boolean;
};

const CJK_SCRIPT = /[\p{Script_Extensions=Han}\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script_Extensions=Hangul}]/u;

function hasCjkBoundary(mainTitle: string, subtitle: string) {
  const before = mainTitle.match(/(\p{L})\P{L}*$/u)?.[1];
  const after = subtitle.match(/\p{L}/u)?.[0];
  return !!before && !!after && CJK_SCRIPT.test(before + after);
}

function getSubtitleBoundaries(name: string): SubtitleBoundary[] {
  const title = name.normalize('NFKC').trim();
  const closing = title.at(-1);
  if (closing !== '-' && closing !== '~' && closing !== '〜') return [];

  const beforeClosing = title.slice(0, -1);
  const delimiter = closing === '-' ? /-/g : /[~〜]/g;
  const boundaries: SubtitleBoundary[] = [];
  for (const { index } of beforeClosing.matchAll(delimiter)) {
    const mainTitle = beforeClosing.slice(0, index).trim();
    const subtitle = beforeClosing.slice(index + 1).trim();
    if (!mainTitle || !/[\p{L}\p{N}]/u.test(subtitle)) continue;
    if (closing === '-' && (mainTitle.endsWith('-') || subtitle.startsWith('-'))) continue;

    const spaced = /\s/.test(title.charAt(index - 1) + title.charAt(index + 1));
    // 两侧没有空格时，至少一侧最近的字母或文字须为中日韩文字。
    if (closing === '-' && !spaced && !hasCjkBoundary(mainTitle, subtitle)) continue;
    boundaries.push({ mainTitle, spaced });
  }
  return boundaries;
}

export function getSubjectSearchKeyword(name: string, type: SubjectTypeId) {
  return type === SubjectTypeId.book
    ? name.replace(/\s*[（(][^0-9０-９()（）]+[）)]$/, '').trim() || name
    : name;
}

export function hasSameSubjectSearchTitle(candidate: SearchResult, name: string) {
  const normalize = (title: string) => normalizeSearchName(title).replace(/\s*[~〜]\s*/g, '~');
  const title = normalize(name);
  return !!title && [candidate.name, candidate.greyName ?? '']
    .some((candidateName) => normalize(candidateName) === title);
}

export function hasSameSubjectMainTitle(candidate: SearchResult, name: string) {
  const nameBoundaries = getSubtitleBoundaries(name);
  return [candidate.name, candidate.greyName ?? ''].some((candidateName) => {
    const candidateBoundaries = getSubtitleBoundaries(candidateName);
    // 比较一方的完整标题，避免把同系列的两个副标题并为同一候选。
    if (nameBoundaries.length && candidateBoundaries.length) return false;

    const [boundaries, shortTitle] = nameBoundaries.length
      ? [nameBoundaries, candidateName] as const
      : [candidateBoundaries, name] as const;
    const normalizedTitle = normalizeSearchName(shortTitle);
    return boundaries.some(({ mainTitle }) => normalizeSearchName(mainTitle) === normalizedTitle);
  });
}

export function getTitleRetryQuery(candidates: readonly SearchResult[], name: string) {
  const boundaries = getSubtitleBoundaries(name);
  // 有多个可能的边界时，优先采用唯一带空格的边界。
  const choices = boundaries.length > 1 ? boundaries.filter(({ spaced }) => spaced) : boundaries;
  if (choices.length !== 1 || candidates.some((candidate) => matchesSubjectTitle(candidate, name))) return;

  return choices[0].mainTitle;
}

export function matchesSubjectTitle(candidate: SearchResult, name: string) {
  return hasSameSubjectSearchTitle(candidate, name) || hasSameSubjectMainTitle(candidate, name);
}
