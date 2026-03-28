import { SearchResult, SingleInfo, SubjectQueryInfo } from '../../interface/subjectInfo';
import { isEqualDate } from '../../utils/utils';

export type FuseSearchOptions = Record<string, unknown>;

/**
 * 过滤搜索结果： 通过名称以及日期
 * @param items
 * @param subjectInfo
 * @param opts
 */
export function filterResults(
  items: SearchResult[],
  subjectInfo: SubjectQueryInfo,
  opts: FuseSearchOptions = {},
  isSearch: boolean = true
): SearchResult | undefined {
  if (!items.length) return;
  // 只有一个结果时直接返回, 不再比较日期
  if (items.length === 1 && isSearch) {
    const result = items[0];
    return result;
    // if (isEqualDate(result.releaseDate, subjectInfo.releaseDate)) {
    // }
  }
  const searchName = subjectInfo.name?.trim();
  if (!searchName) {
    return;
  }
  const results = new Fuse(items, { ...opts }).search(searchName);
  if (!results.length) return;
  // 有参考的发布时间
  if (subjectInfo.releaseDate) {
    for (const item of results) {
      const result = item.item;
      if (result.releaseDate) {
        if (isEqualDate(result.releaseDate, subjectInfo.releaseDate)) {
          return result;
        }
      }
    }
  }
  // 比较名称
  const nameRe = new RegExp(searchName);
  for (const item of results) {
    const result = item.item;
    if (nameRe.test(result.name) || nameRe.test(result.greyName ?? '')) {
      return result;
    }
  }
  return results[0]?.item;
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

