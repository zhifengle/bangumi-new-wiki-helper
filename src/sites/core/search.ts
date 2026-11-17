import Fuse, { type IFuseOptions } from 'fuse.js';
import { SearchResult, SingleInfo, SubjectQueryInfo } from '../../interface/subjectInfo';
import { isEqualDate } from '../../utils/utils';

export type FuseSearchOptions = IFuseOptions<SearchResult>;

const DEFAULT_SEARCH_OPTIONS: IFuseOptions<SearchResult> = {
  includeScore: true,
  ignoreDiacritics: true,
  ignoreLocation: true,
  threshold: 0.35,
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'greyName', weight: 0.3 },
  ],
};

export function normalizeSearchName(name: string) {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function hasSameSearchName(candidate: SearchResult, name: string) {
  const normalizedName = normalizeSearchName(name);
  return !!normalizedName && [candidate.name, candidate.greyName ?? '']
    .some((candidateName) => normalizeSearchName(candidateName) === normalizedName);
}

/**
 * 排序搜索引擎召回的候选。精确标题始终优先，Fuse 只负责相似标题的
 * 召回和排序，不参与“是否为同一条目”的最终判断。
 */
export function rankSearchResults(
  items: SearchResult[],
  searchName: string,
  opts: FuseSearchOptions = {}
) {
  const name = searchName.trim();
  if (!name || !items.length) return [];

  const exact = items.filter((item) => hasSameSearchName(item, name));
  const exactUrls = new Set(exact.map(({ url }) => url));
  const fuzzy = new Fuse(items, { ...DEFAULT_SEARCH_OPTIONS, ...opts })
    .search(name)
    .map(({ item }) => item)
    .filter(({ url }) => !exactUrls.has(url));
  return [...exact, ...fuzzy];
}

/**
 * 过滤搜索结果： 通过名称以及日期
 * @param items
 * @param subjectInfo
 * @param opts
 */
export function filterResults(
  items: SearchResult[],
  subjectInfo: SubjectQueryInfo,
  opts: FuseSearchOptions = {}
): SearchResult | undefined {
  const searchName = subjectInfo.name?.trim();
  if (!searchName) return;

  const results = rankSearchResults(items, searchName, opts);
  if (!results.length) return;

  if (subjectInfo.releaseDate) {
    const sameDate = results.find(
      ({ releaseDate }) =>
        releaseDate && isEqualDate(releaseDate, subjectInfo.releaseDate!)
    );
    if (sameDate) return sameDate;
  }
  return results[0];
}

function toStringValue(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }
  return String(value);
}

export function getQueryInfo(items: SingleInfo[]): SubjectQueryInfo {
  const info: SubjectQueryInfo = {};
  items.forEach((item) => {
    const value = toStringValue(item.value);
    if (!value) {
      return;
    }
    if (item.category === 'subject_title') {
      info.name = value;
    }
    if (item.category === 'date') {
      info.releaseDate = value;
    }
    if (item.category === 'ASIN') {
      info.asin = value;
    }
    if (item.category === 'ISBN') {
      info.isbn = value;
    }
  });
  return info;
}

