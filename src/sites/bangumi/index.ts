import {AllSubject, BookSubject, SearchResult} from '../../interface/subject';
import {sleep} from '../../utils/async/sleep';
import {fetchText} from '../../utils/fetchData';
import {SubjectTypeId} from '../../interface/wiki';
import {dealDate} from '../../utils/utils';
import {filterResults} from '../common';

export enum BangumiDomain {
  chii = 'chii.in',
  bgm = 'bgm.tv',
  bangumi = 'bangumi.tv',
}

export enum Protocol {
  http = 'http',
  https = 'https',
}

/**
 * 处理搜索页面的 html
 * @param info 字符串 html
 */
function dealSearchResults(info: string): [SearchResult[], number] | [] {
  const results: SearchResult[] = [];
  let $doc = new DOMParser().parseFromString(info, 'text/html');
  let items = $doc.querySelectorAll('#browserItemList>li>div.inner');
  // get number of page
  let numOfPage = 1;
  let pList = $doc.querySelectorAll('.page_inner>.p');
  if (pList && pList.length) {
    let tempNum = parseInt(
      pList[pList.length - 2].getAttribute('href').match(/page=(\d*)/)[1]
    );
    numOfPage = parseInt(
      pList[pList.length - 1].getAttribute('href').match(/page=(\d*)/)[1]
    );
    numOfPage = numOfPage > tempNum ? numOfPage : tempNum;
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
  } else {
    return [];
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
  subjectInfo: AllSubject,
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
    // 去掉末尾的括号并加上引号
    query = query.replace(/（[^0-9]+?）|\([^0-9]+?\)$/, '');
    query = `"${query}"`;
  }
  if (uniqueQueryStr) {
    query = `"${uniqueQueryStr || ''}"`;
  }
  if (!query || query === '""') {
    console.info('Query string is empty');
    return;
  }
  const url = `${bgmHost}/subject_search/${encodeURIComponent(
    query
  )}?cat=${type}`;
  console.info('search bangumi subject URL: ', url);
  const rawText = await fetchText(url);
  const rawInfoList = dealSearchResults(rawText)[0] || [];
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
  subjectInfo: AllSubject,
  bgmHost: string = 'https://bgm.tv',
  pageNumber: number = 1,
  type: string
): Promise<SearchResult> {
  if (!subjectInfo || !subjectInfo.releaseDate || !subjectInfo.name) {
    throw new Error('invalid subject info');
  }
  const releaseDate = new Date(subjectInfo.releaseDate);
  if (isNaN(releaseDate.getTime())) {
    throw `invalid releasedate: ${subjectInfo.releaseDate}`;
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
  const rawText = await fetchText(url);
  let [rawInfoList, numOfPage] = dealSearchResults(rawText);
  const options = {
    threshold: 0.3,
    keys: ['name', 'greyName'],
  };
  let result = filterResults(rawInfoList, subjectInfo, options, false);
  if (!result) {
    if (pageNumber < numOfPage) {
      await sleep(300);
      return await findSubjectByDate(
        subjectInfo,
        bgmHost,
        pageNumber + 1,
        type
      );
    } else {
      throw 'notmatched';
    }
  }
  return result;
}

export async function checkBookSubjectExist(
  subjectInfo: BookSubject,
  bgmHost: string = 'https://bgm.tv',
  type: SubjectTypeId
) {
  const numISBN = subjectInfo.isbn.replace(/-/g, '')
  let searchResult = await searchSubject(
    subjectInfo,
    bgmHost,
    type,
    numISBN,
  );
  console.info(`First: search book of bangumi: `, searchResult);
  if (searchResult && searchResult.url) {
    return searchResult;
  }
  // 判断一下是否重复
  if (numISBN !== subjectInfo.isbn) {
    searchResult = await searchSubject(
      subjectInfo,
      bgmHost,
      type,
      subjectInfo.isbn
    );
    console.info(`Second: search book by ${subjectInfo.isbn}: `, searchResult);
    if (searchResult && searchResult.url) {
      return searchResult;
    }
  }
  // 默认使用名称搜索
  searchResult = await searchSubject(subjectInfo, bgmHost, type);
  console.info('Third: search book of bangumi: ', searchResult);
  return searchResult;
}

/**
 * 查找条目是否存在： 通过名称搜索或者日期加上名称的过滤查询
 * @param subjectInfo 条目基本信息
 * @param bgmHost bangumi 域名
 * @param type 条目类型
 */
async function checkExist(
  subjectInfo: AllSubject,
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
  subjectInfo: AllSubject,
  bgmHost: string = 'https://bgm.tv',
  type: SubjectTypeId,
  disableDate?: boolean
) {
  let result;
  switch (type) {
    case SubjectTypeId.book:
      result = await checkBookSubjectExist(
        subjectInfo as BookSubject,
        bgmHost,
        type
      );
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
