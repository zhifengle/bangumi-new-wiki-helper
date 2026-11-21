import {SearchResult, SubjectQueryInfo} from '../../interface/subjectInfo';
import {sleep} from '../../utils/async/sleep';
import {fetchJson, fetchText} from '../../utils/fetchData';
import {SubjectTypeId} from '../../interface/wiki';
import {dealDate} from '../../utils/utils';
import { hasSameSearchName, rankSearchResults } from '../core/search';
import {
  getSubjectSearchKeyword,
  getTitleRetryQuery,
  hasSameSubjectMainTitle,
  hasSameSubjectSearchTitle,
  matchesSubjectTitle,
} from '../core/subjectTitle';
import { getSubjectISBNs, searchSubjectsByTitle } from './authenticatedSearch';
import { searchSubjectsByCreator } from './personWorks';

export enum BangumiDomain {
  chii = 'chii.in',
  bgm = 'bgm.tv',
  bangumi = 'bangumi.tv',
}

export enum Protocol {
  http = 'http',
  https = 'https',
}

/** Bangumi HTML 搜索页使用约 60 秒的搜索冷却 Cookie。 */
export const HTML_SEARCH_INTERVAL_MS = 60 * 1000;

type JsonSearchType = 'book' | 'music' | 'game';

export type BangumiSearchOptions = {
  host?: string;
  type?: SubjectTypeId;
  fallbackToWebSearch?: boolean;
  fallbackToPersonWorks?: boolean;
  useLegacyJsonSearch?: boolean;
  accessToken?: string;
};

export type BangumiExistSearchOptions = Omit<
  BangumiSearchOptions,
  'type'
> & {
  type: SubjectTypeId;
};

export type SubjectDuplicateResult = SearchResult | { candidates: SearchResult[] } | undefined;

type BangumiJsonSearchItem = {
  id: string | number;
  type_id: string | number;
  name: string;
  name_cn?: string;
  date?: string;
  url_mod?: string;
};

const JSON_SEARCH_TYPES: Partial<Record<SubjectTypeId, JsonSearchType>> = {
  [SubjectTypeId.book]: 'book',
  [SubjectTypeId.music]: 'music',
  [SubjectTypeId.game]: 'game',
};

let lastHtmlSearchAt = 0;

export class InvalidBangumiSearchResponseError extends Error {
  constructor() {
    super('Invalid Bangumi search response: result list not found');
    this.name = 'InvalidBangumiSearchResponseError';
  }
}

export class UnauthenticatedBangumiSearchError extends Error {
  constructor() {
    super('Bangumi search response is unauthenticated');
    this.name = 'UnauthenticatedBangumiSearchError';
  }
}

function isBangumiJsonSearchItem(value: unknown): value is BangumiJsonSearchItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<BangumiJsonSearchItem>;
  return (
    /^(?:[1-9]\d*)$/.test(String(item.id)) &&
    (typeof item.type_id === 'string' || typeof item.type_id === 'number') &&
    typeof item.name === 'string'
  );
}

function dealJsonSearchResults(
  info: unknown,
  expectedType: SubjectTypeId
): SearchResult[] {
  // Bangumi JSON 搜索在没有结果时返回 null。
  if (info === null) {
    return [];
  }
  if (!Array.isArray(info) || !info.every(isBangumiJsonSearchItem)) {
    throw new Error('Invalid Bangumi JSON search response');
  }
  return info
    .filter(
      (item) =>
        Number(item.type_id) === Number(expectedType) &&
        (!item.url_mod || item.url_mod === 'subject')
    )
    .map((item) => ({
      name: item.name,
      greyName: item.name_cn?.trim() ?? '',
      releaseDate: typeof item.date === 'string' ? item.date : undefined,
      url: `/subject/${item.id}`,
    }));
}

async function fetchHtmlSearchResults(url: string) {
  const waitTime = HTML_SEARCH_INTERVAL_MS - (Date.now() - lastHtmlSearchAt);
  if (lastHtmlSearchAt && waitTime > 0) {
    await sleep(waitTime);
  }
  lastHtmlSearchAt = Date.now();
  return dealSearchResults(await fetchText(url));
}

/**
 * 处理搜索页面的 html
 * @param info 字符串 html
 */
export function dealSearchResults(info: string): [SearchResult[], number] {
  const results: SearchResult[] = [];
  let $doc = new DOMParser().parseFromString(info, 'text/html');
  const isUnauthenticated =
    /\bCHOBITS_UID\s*=\s*['"]?0\b/.test(info) ||
    !!$doc.querySelector('.guest.login[href*="/login"]');
  if (isUnauthenticated) {
    throw new UnauthenticatedBangumiSearchError();
  }
  const $resultList = $doc.querySelector('#browserItemList');
  if (!$resultList) {
    throw new InvalidBangumiSearchResponseError();
  }
  let items = $resultList.querySelectorAll('li>div.inner');
  // get number of page
  let numOfPage = 1;
  let pList = $doc.querySelectorAll('.page_inner>.p');
  if (pList.length >= 2) {
    const secondLastPage = pList[pList.length - 2]
      .getAttribute('href')
      ?.match(/page=(\d+)/)?.[1];
    const lastPage = pList[pList.length - 1]
      .getAttribute('href')
      ?.match(/page=(\d+)/)?.[1];
    const tempNum = Number.parseInt(secondLastPage ?? '1', 10);
    numOfPage = Number.parseInt(lastPage ?? '1', 10);
    numOfPage = Math.max(numOfPage, tempNum);
  }
  if (items && items.length) {
    for (const item of Array.prototype.slice.call(items)) {
      const $subjectTitle = item.querySelector('h3>a.l');
      const href = $subjectTitle?.getAttribute('href') ?? '';
      const subjectUrl = href.match(/^\/subject\/[1-9]\d*(?=$|[?#/])/)?.[0];
      if (!$subjectTitle || !subjectUrl) {
        throw new InvalidBangumiSearchResponseError();
      }
      let itemSubject: SearchResult = {
        name: $subjectTitle.textContent.trim(),
        // url 没有协议和域名
        url: subjectUrl,
        greyName: item.querySelector('h3>.grey')
          ? item.querySelector('h3>.grey').textContent.trim()
          : '',
      };
      let matchDate = item
        .querySelector('.info')
        ?.textContent.match(/\d{4}[\-\/\年]\d{1,2}[\-\/\月]\d{1,2}/);
      if (matchDate) {
        itemSubject.releaseDate = dealDate(matchDate[0]);
      }
      let $rateInfo = item.querySelector('.rateInfo');
      if ($rateInfo) {
        if ($rateInfo.querySelector('.fade')) {
          itemSubject.score = $rateInfo.querySelector('.fade').textContent;
          itemSubject.count = $rateInfo
            .querySelector('.tip_j')
            .textContent.replace(/[^0-9]/g, '');
        } else {
          itemSubject.score = '0';
          itemSubject.count = '少于10';
        }
      } else {
        itemSubject.score = '0';
        itemSubject.count = '0';
      }
      results.push(itemSubject);
    }
  }
  return [results, numOfPage];
}

async function searchLegacyCandidates(
  query: string,
  jsonSearchType: JsonSearchType,
  type: SubjectTypeId,
  host: string,
  title?: string
): Promise<SearchResult[]> {
  async function searchJson(keyword: string) {
    const url = `${host}/json/search-${jsonSearchType}/${encodeURIComponent(keyword)}`;
    console.info('search bangumi subject JSON URL: ', url);
    return dealJsonSearchResults(await fetchJson<unknown>(url), type);
  }
  const candidates = await searchJson(query);
  const retryQuery = title && getTitleRetryQuery(candidates, title);
  if (retryQuery && retryQuery !== query) candidates.push(...await searchJson(retryQuery));
  return candidates;
}

async function searchWebCandidates(query: string, type: SubjectTypeId, host: string) {
  const htmlQuery = type === SubjectTypeId.book ? `"${query}"` : query;
  const url = `${host}/subject_search/${encodeURIComponent(
    htmlQuery
  )}?cat=${type}`;
  console.info('search bangumi subject HTML URL: ', url);
  const [candidates] = await fetchHtmlSearchResults(url);
  return candidates;
}

async function searchTitleCandidates(
  keyword: string,
  title: string,
  options: BangumiExistSearchOptions & { type: Exclude<SubjectTypeId, SubjectTypeId.all> }
) {
  const { type, host = 'https://bgm.tv', accessToken } = options;
  const legacyType = options.useLegacyJsonSearch !== false ? JSON_SEARCH_TYPES[type] : undefined;
  const useV0Fallback = legacyType && accessToken;
  const useWebFallback = !accessToken && options.fallbackToWebSearch;
  let candidates: SearchResult[] = [];
  try {
    candidates = legacyType
      ? await searchLegacyCandidates(keyword, legacyType, type, host, title)
      : await searchSubjectsByTitle(keyword, type, title, accessToken);
  } catch (error) {
    if (!useV0Fallback && !useWebFallback) throw error;
    console.warn('Bangumi initial title search failed:', error);
  }

  if (candidates.some((candidate) => matchesSubjectTitle(candidate, title))) return candidates;

  if (useV0Fallback) {
    const v0Candidates = await searchSubjectsByTitle(keyword, type, title, accessToken);
    return [...v0Candidates, ...candidates];
  }
  if (useWebFallback) {
    const webCandidates = await searchWebCandidates(keyword, type, host);
    return [...webCandidates, ...candidates];
  }
  return candidates;
}

function normalizeISBN(isbn: string) {
  return isbn.normalize('NFKC').replace(/[\s-]/g, '').toUpperCase();
}

function uniqueByUrl(candidates: SearchResult[]) {
  const byUrl = new Map<string, SearchResult>();
  for (const candidate of candidates) {
    const first = byUrl.get(candidate.url);
    byUrl.set(candidate.url, first ? {
      ...first,
      greyName: first.greyName || candidate.greyName,
      releaseDate: first.releaseDate || candidate.releaseDate,
      ...(candidate.personCredit && { personCredit: candidate.personCredit }),
    } : candidate);
  }
  return [...byUrl.values()];
}

async function verifyISBN(candidate: SearchResult, isbn: string, token?: string) {
  try {
    const candidateISBNs = await getSubjectISBNs(candidate.url.slice('/subject/'.length), token);
    return candidateISBNs.some((value) => normalizeISBN(value) === isbn);
  } catch (error) {
    // 详情无法访问时仅保留候选，不把搜索索引的命中当成 ISBN 一致。
    console.warn('Bangumi ISBN verification failed:', error);
    return false;
  }
}

async function verifiedISBNUrls(
  candidates: SearchResult[],
  isbn: string,
  token?: string
) {
  const checks = await Promise.all(candidates.map(async (candidate) => ({
    url: candidate.url,
    matches: await verifyISBN(candidate, isbn, token),
  })));
  return new Set(checks.filter(({ matches }) => matches).map(({ url }) => url));
}

/**
 * 已验证 ISBN 或唯一的完整标题与日期组合可以自动命中。
 * 主标题和相似标题只作为人工复核候选。
 */
export function matchSubjectCandidates(
  candidates: SearchResult[],
  subjectInfo: SubjectQueryInfo,
  options: {
    isbnCandidateUrls?: ReadonlySet<string>;
    verifiedISBNUrls?: ReadonlySet<string>;
  } = {}
): SubjectDuplicateResult {
  const items = uniqueByUrl(candidates);
  const verifiedUrls = options.verifiedISBNUrls ?? new Set<string>();
  const verified = items.filter(({ url }) => verifiedUrls.has(url));
  if (verified.length === 1) return verified[0];
  if (verified.length > 1) return { candidates: verified };

  const name = subjectInfo.name?.trim() ?? '';
  const exact = items.filter((candidate) => hasSameSearchName(candidate, name));
  const sourceDate = subjectInfo.releaseDate && dealDate(subjectInfo.releaseDate);
  const sameDate = sourceDate
    ? exact.filter(
        ({ releaseDate }) => releaseDate && dealDate(releaseDate) === sourceDate
      )
    : [];

  // 提供 ISBN 却未验证一致时，不允许较弱的标题/日期覆盖这个冲突信号。
  if (!subjectInfo.isbn && sameDate.length === 1) return sameDate[0];

  const mainTitleMatches = items.filter((candidate) => hasSameSubjectMainTitle(candidate, name));
  const ranked = new Set([
    ...sameDate,
    ...exact,
    ...items.filter((candidate) => hasSameSubjectSearchTitle(candidate, name)),
    ...mainTitleMatches,
    ...rankSearchResults(items, name),
    ...items.filter(({ url }) => options.isbnCandidateUrls?.has(url)),
  ]);
  return ranked.size ? { candidates: [...ranked] } : undefined;
}

/**
 * 查找条目是否存在
 * @param subjectInfo 条目基本信息
 * @param options 搜索配置
 */
export async function checkSubjectExit(
  subjectInfo: SubjectQueryInfo,
  options: BangumiExistSearchOptions
): Promise<SubjectDuplicateResult> {
  const { type, accessToken, host = 'https://bgm.tv' } = options;
  if (type === SubjectTypeId.all) throw new Error('Subject type is missing');
  const name = subjectInfo.name?.trim() ?? '';
  const isbn = type === SubjectTypeId.book ? normalizeISBN(subjectInfo.isbn ?? '') : '';
  if (!name && !isbn) throw new Error('Subject title and ISBN are missing');

  const allowWebSearch = !accessToken && options.fallbackToWebSearch;
  const keyword = getSubjectSearchKeyword(name, type);
  let isbnCandidates: SearchResult[] = [];
  if (isbn) {
    try {
      isbnCandidates = await searchLegacyCandidates(isbn, 'book', type, host);
    } catch (error) {
      if (!allowWebSearch) throw error;
      console.warn('Bangumi ISBN search failed:', error);
    }
    if (!keyword && !isbnCandidates.length && allowWebSearch) {
      isbnCandidates = await searchWebCandidates(isbn, type, host);
    }
    isbnCandidates = uniqueByUrl(isbnCandidates);
  }
  const isbnCandidateUrls = new Set(isbnCandidates.map(({ url }) => url));
  let matchingISBNUrls = isbn
    ? await verifiedISBNUrls(isbnCandidates, isbn, accessToken)
    : new Set<string>();
  if (matchingISBNUrls.size) {
    return matchSubjectCandidates(isbnCandidates, subjectInfo, {
      isbnCandidateUrls,
      verifiedISBNUrls: matchingISBNUrls,
    });
  }

  const titleCandidates = keyword
    ? await searchTitleCandidates(keyword, name, { ...options, type })
    : [];
  let personCandidates: SearchResult[] = [];
  if (
    keyword && options.fallbackToPersonWorks && subjectInfo.creators?.length &&
    !titleCandidates.some((candidate) => matchesSubjectTitle(candidate, name))
  ) {
    try {
      personCandidates = await searchSubjectsByCreator(name, type, subjectInfo.creators);
    } catch (error) {
      console.warn('Bangumi person works search failed:', error);
    }
  }
  const candidates = uniqueByUrl([...titleCandidates, ...isbnCandidates]);

  if (isbn) {
    const uncheckedExact = candidates.filter(
      (candidate) =>
        !isbnCandidateUrls.has(candidate.url) && hasSameSearchName(candidate, name)
    );
    matchingISBNUrls = await verifiedISBNUrls(uncheckedExact, isbn, accessToken);
  }
  const result = matchSubjectCandidates(candidates, subjectInfo, {
    isbnCandidateUrls,
    verifiedISBNUrls: matchingISBNUrls,
  });
  if (!personCandidates.length || (result && 'url' in result)) return result;
  const titleMatches = result && 'candidates' in result ? result.candidates : [];
  return { candidates: uniqueByUrl([...personCandidates, ...titleMatches]) };
}

export function changeDomain(
  originUrl: string,
  domain: BangumiDomain,
  protocol: Protocol = Protocol.https
): string {
  let url = originUrl;
  if (url.match(domain)) return url;
  let domainArr = [
    BangumiDomain.bangumi,
    BangumiDomain.chii,
    BangumiDomain.bgm,
  ];
  domainArr.splice(domainArr.indexOf(domain), 1);
  return url
    .replace(new RegExp(domainArr.join('|').replace('.', '\\.')), domain)
    .replace(/https?/, protocol);
}
