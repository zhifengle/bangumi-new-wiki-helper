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
  bgmHost: string = 'https://bgm.tv',
  type: SubjectTypeId = SubjectTypeId.all,
  uniqueQueryStr: string = ''
) {
  let releaseDate: string;
  if (subjectInfo && subjectInfo.releaseDate) {
    releaseDate = subjectInfo.releaseDate;
  }
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
  const url = `${bgmHost}/subject_search/${encodeURIComponent(
    htmlQuery
  )}?cat=${type}`;
  let rawInfoList: SearchResult[] | undefined;
  const jsonSearchType = JSON_SEARCH_TYPES[type];
  if (jsonSearchType) {
    const jsonUrl = `${bgmHost}/json/search-${jsonSearchType}/${encodeURIComponent(query)}`;
    console.info('search bangumi subject JSON URL: ', jsonUrl);
    try {
      rawInfoList = dealJsonSearchResults(
        await fetchJson<unknown>(jsonUrl),
        type
      );
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
  const options = {
    keys: ['name', 'greyName'],
  };
  return filterResults(rawInfoList, subjectInfo, options);
}

/**
 * 通过时间查找条目
 * @param subjectInfo 条目信息
 * @param pageNumber 页码
 * @param type 条目类型
 */
export async function findSubjectByDate(
  subjectInfo: SubjectQueryInfo,
  bgmHost: string = 'https://bgm.tv',
  pageNumber: number = 1,
  type: string
): Promise<SearchResult | undefined> {
  if (!subjectInfo || !subjectInfo.releaseDate || !subjectInfo.name) {
    throw new Error('invalid subject info');
  }
  const releaseDate = new Date(subjectInfo.releaseDate);
  if (isNaN(releaseDate.getTime())) {
    throw new Error(`invalid releasedate: ${subjectInfo.releaseDate}`);
  }
  const sort = releaseDate.getDate() > 15 ? 'sort=date' : '';
  const page = pageNumber ? `page=${pageNumber}` : '';
  let query = '';
  if (sort && page) {
    query = '?' + sort + '&' + page;
  } else if (sort) {
    query = '?' + sort;
  } else if (page) {
    query = '?' + page;
  }
  const url = `${bgmHost}/${type}/browser/airtime/${releaseDate.getFullYear()}-${
    releaseDate.getMonth() + 1
  }${query}`;
  console.info('find subject by date: ', url);
  let [rawInfoList, numOfPage] = await fetchHtmlSearchResults(url);
  const options = {
    threshold: 0.3,
    keys: ['name', 'greyName'],
  };
  let result = filterResults(rawInfoList, subjectInfo, options, false);
  if (!result) {
    if (pageNumber < numOfPage) {
      return await findSubjectByDate(
        subjectInfo,
        bgmHost,
        pageNumber + 1,
        type
      );
    } else {
      return undefined;
    }
  }
  return result;
}

export async function checkBookSubjectExist(
  subjectInfo: SubjectQueryInfo,
  bgmHost: string = 'https://bgm.tv',
  type: SubjectTypeId
) {
  if (subjectInfo.isbn) {
    const numISBN = subjectInfo.isbn.replace(/-/g, '');
    const searchResult = await searchSubject(
      subjectInfo,
      bgmHost,
      type,
      numISBN
    );
    console.info(`First: search book of bangumi: `, searchResult);
    if (searchResult && searchResult.url) {
      return searchResult;
    }
  }
  // 默认使用名称搜索
  const searchResult = await searchSubject(subjectInfo, bgmHost, type);
  console.info('Second: search book of bangumi by name: ', searchResult);
  return searchResult;
}

/**
 * 查找条目是否存在： 通过名称搜索或者日期加上名称的过滤查询
 * @param subjectInfo 条目基本信息
 * @param bgmHost bangumi 域名
 * @param type 条目类型
 */
async function checkExist(
  subjectInfo: SubjectQueryInfo,
  bgmHost: string = 'https://bgm.tv',
  type: SubjectTypeId,
  disabelDate?: boolean
) {
  const subjectTypeDict = {
    [SubjectTypeId.game]: 'game',
    [SubjectTypeId.anime]: 'anime',
    [SubjectTypeId.music]: 'music',
    [SubjectTypeId.book]: 'book',
    [SubjectTypeId.real]: 'real',
    [SubjectTypeId.all]: 'all',
  };
  let searchResult = await searchSubject(subjectInfo, bgmHost, type);
  console.info(`First: search result of bangumi: `, searchResult);
  if (searchResult && searchResult.url) {
    return searchResult;
  }
  if (disabelDate) {
    return;
  }
  searchResult = await findSubjectByDate(
    subjectInfo,
    bgmHost,
    1,
    subjectTypeDict[type]
  );
  console.info(`Second: search result by date: `, searchResult);
  return searchResult;
}

export async function checkSubjectExit(
  subjectInfo: SubjectQueryInfo,
  bgmHost: string = 'https://bgm.tv',
  type: SubjectTypeId,
  disableDate?: boolean
) {
  let result;
  switch (type) {
    case SubjectTypeId.book:
      result = await checkBookSubjectExist(subjectInfo, bgmHost, type);
      break;
    case SubjectTypeId.game:
      result = await checkExist(subjectInfo, bgmHost, type, disableDate);
      break;
    case SubjectTypeId.music:
      result = await checkExist(subjectInfo, bgmHost, type, true);
      break;
    case SubjectTypeId.anime:
    case SubjectTypeId.real:
    default:
      console.info('not support type: ', type);
  }
  return result;
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
