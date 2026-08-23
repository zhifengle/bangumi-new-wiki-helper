import {SearchResult, SubjectQueryInfo} from '../../interface/subjectInfo';
import {sleep} from '../../utils/async/sleep';
import {fetchJson, fetchText} from '../../utils/fetchData';
import {SubjectTypeId} from '../../interface/wiki';
import {dealDate} from '../../utils/utils';
import { filterResults } from '../core/search';

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
  uniqueQueryStr?: string;
  fallbackToWebSearch?: boolean;
};

export type BangumiExistSearchOptions = Omit<
  BangumiSearchOptions,
  'type' | 'uniqueQueryStr'
> & {
  type: SubjectTypeId;
};

type BangumiJsonSearchItem = {
  id: string | number;
  type_id: string | number;
  name: string;
  name_cn?: string;
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
    (typeof item.id === 'string' || typeof item.id === 'number') &&
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
      let $subjectTitle = item.querySelector('h3>a.l');
      let itemSubject: SearchResult = {
        name: $subjectTitle.textContent.trim(),
        // url 没有协议和域名
        url: $subjectTitle.getAttribute('href'),
        greyName: item.querySelector('h3>.grey')
          ? item.querySelector('h3>.grey').textContent.trim()
          : '',
      };
      let matchDate = item
        .querySelector('.info')
        .textContent.match(/\d{4}[\-\/\年]\d{1,2}[\-\/\月]\d{1,2}/);
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

/**
 * 搜索条目
 * @param subjectInfo
 * @param type
 * @param uniqueQueryStr
 */
export async function searchSubject(
  subjectInfo: SubjectQueryInfo,
  options: BangumiSearchOptions = {}
) {
  const {
    host = 'https://bgm.tv',
    type = SubjectTypeId.all,
    uniqueQueryStr = '',
    fallbackToWebSearch = false,
  } = options;
  let query = (subjectInfo.name || '').trim();
  if (type === SubjectTypeId.book) {
    // 去掉末尾的括号
    query = query.replace(/（[^0-9]+?）|\([^0-9]+?\)$/, '');
  }
  if (uniqueQueryStr) {
    query = uniqueQueryStr.trim();
  }
  if (!query) {
    console.info('Query string is empty');
    return;
  }
  const htmlQuery =
    type === SubjectTypeId.book || uniqueQueryStr ? `"${query}"` : query;
  const url = `${host}/subject_search/${encodeURIComponent(
    htmlQuery
  )}?cat=${type}`;
  let rawInfoList: SearchResult[] | undefined;
  const jsonSearchType = JSON_SEARCH_TYPES[type];
  if (jsonSearchType) {
    const jsonUrl = `${host}/json/search-${jsonSearchType}/${encodeURIComponent(query)}`;
    console.info('search bangumi subject JSON URL: ', jsonUrl);
    try {
      const jsonResponse = await fetchJson<unknown>(jsonUrl);
      if (jsonResponse === null && fallbackToWebSearch) {
        console.info('Bangumi JSON search returned null, falling back to HTML');
      } else {
        rawInfoList = dealJsonSearchResults(jsonResponse, type);
      }
    } catch (error) {
      console.warn('Bangumi JSON search failed, falling back to HTML:', error);
    }
  }
  if (!rawInfoList) {
    console.info('search bangumi subject HTML URL: ', url);
    rawInfoList = (await fetchHtmlSearchResults(url))[0];
  }
  // 使用指定搜索字符串如 ISBN 搜索时, 并且结果只有一条时，不再使用名称过滤
  if (uniqueQueryStr && rawInfoList && rawInfoList.length === 1) {
    return rawInfoList[0];
  }
  const filterOptions = {
    keys: ['name', 'greyName'],
  };
  return filterResults(rawInfoList, subjectInfo, filterOptions);
}

export async function checkBookSubjectExist(
  subjectInfo: SubjectQueryInfo,
  options: BangumiExistSearchOptions
) {
  if (subjectInfo.isbn) {
    const numISBN = subjectInfo.isbn.replace(/-/g, '');
    const searchResult = await searchSubject(subjectInfo, {
      ...options,
      uniqueQueryStr: numISBN,
    });
    console.info(`First: search book of bangumi: `, searchResult);
    if (searchResult && searchResult.url) {
      return searchResult;
    }
  }
  // 默认使用名称搜索
  const searchResult = await searchSubject(subjectInfo, options);
  console.info('Second: search book of bangumi by name: ', searchResult);
  return searchResult;
}

/**
 * 查找条目是否存在
 * @param subjectInfo 条目基本信息
 * @param options 搜索配置
 */
export async function checkSubjectExit(
  subjectInfo: SubjectQueryInfo,
  options: BangumiExistSearchOptions
) {
  switch (options.type) {
    case SubjectTypeId.book:
      return checkBookSubjectExist(subjectInfo, options);
    case SubjectTypeId.game:
    case SubjectTypeId.music: {
      const result = await searchSubject(subjectInfo, options);
      console.info('Search result of bangumi: ', result);
      return result;
    }
    case SubjectTypeId.anime:
    case SubjectTypeId.real:
    default:
      console.info('not support type: ', options.type);
  }
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
