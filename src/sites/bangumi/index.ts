import {
  AllSubject,
  BookSubject,
  SearchResult,
  SingleInfo,
  Subject,
  SubjectWikiInfo
} from '../../interface/subject'
import {sleep} from "../../utils/async/sleep";
import {$q, $qa} from "../../utils/domUtils";
import {fetchText} from "../../utils/fetchData";
import {SubjectTypeId} from "../../interface/wiki";
import {dealDate} from "../../utils/utils";

const domain = 'bgm.tv';
const protocol = 'https:'

enum SubjectTypeEnum {
  GAME = "game",
  ANIME = "anime",
  MUSIC = "music",
  BOOK = "book",
  REAL = "real"
}

export enum BangumiDomain {
  chii = 'chii.in',
  bgm = 'bgm.tv',
  bangumi = 'bangumi.tv'
}

export enum Protocol {
  http = 'http',
  https = 'https'
}


/**
 * 处理搜索页面的 html
 * @param info 字符串 html
 */
function dealSearchResults(info: string): [SearchResult[], number] | [] {
  const results: SearchResult[] = []
  let $doc = (new DOMParser()).parseFromString(info, "text/html");
  let items = $doc.querySelectorAll('#browserItemList>li>div.inner');
  // get number of page
  let numOfPage = 1;
  let pList = $doc.querySelectorAll('.page_inner>.p');
  if (pList && pList.length) {
    let tempNum = parseInt(pList[pList.length - 2].getAttribute('href').match(/page=(\d*)/)[1]);
    numOfPage = parseInt(pList[pList.length - 1].getAttribute('href').match(/page=(\d*)/)[1]);
    numOfPage = numOfPage > tempNum ? numOfPage : tempNum;
  }
  if (items && items.length) {
    for (const item of Array.prototype.slice.call(items)) {
      let $subjectTitle = item.querySelector('h3>a.l');
      let itemSubject: SearchResult = {
        name: $subjectTitle.textContent.trim(),
        url: `${protocol}//${domain}` + $subjectTitle.getAttribute('href'),
        greyName: item.querySelector('h3>.grey') ?
          item.querySelector('h3>.grey').textContent.trim() : '',
      };
      let matchDate = item.querySelector('.info').textContent.match(/\d{4}[\-\/\年]\d{1,2}[\-\/\月]\d{1,2}/);
      if (matchDate) {
        itemSubject.releaseDate = dealDate(matchDate[0]);
      }
      let $rateInfo = item.querySelector('.rateInfo');
      if ($rateInfo) {
        if ($rateInfo.querySelector('.fade')) {
          itemSubject.score = $rateInfo.querySelector('.fade').textContent;
          itemSubject.count = $rateInfo.querySelector('.tip_j').textContent.replace(/[^0-9]/g, '');
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
 * 过滤搜索结果： 通过名称以及日期
 * @param items
 * @param subjectInfo
 * @param opts
 */
function filterResults(items: SearchResult[], subjectInfo: AllSubject, opts: any) {
  if (!items) return;
  let results = new Fuse(items, Object.assign({
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    distance: 50,
    maxPatternLength: 32,
    minMatchCharLength: 1,
  }, opts))
    .search(subjectInfo.name);
  if (!results.length) return;
  if (subjectInfo.releaseDate) {
    for (const result of results) {
      if (result.releaseDate) {
        const resultDate = new Date(result.releaseDate)
        const originDate = new Date(subjectInfo.releaseDate)
        if (resultDate.getFullYear() === originDate.getFullYear() &&
          resultDate.getMonth() === originDate.getMonth() &&
          resultDate.getDate() === originDate.getDate()
        ) {
          return result;
        }
      }
    }
  } else {
    return results[0];
  }
}

/**
 * 搜索条目
 * @param subjectInfo
 * @param type
 * @param uniqueQueryStr
 */
export async function searchSubject(
  subjectInfo: AllSubject,
  type: SubjectTypeId = SubjectTypeId.all,
  uniqueQueryStr: string = '') {
  let releaseDate: string
  if (subjectInfo && subjectInfo.releaseDate) {
    releaseDate = subjectInfo.releaseDate;
  }
  // 去掉末尾的括号加上引号搜索
  let query = (subjectInfo.name || '').trim()
    .replace(/（[^0-9]+?）|\([^0-9]+?\)$/, '');
  query = `"${query}"`;
  if (uniqueQueryStr) {
    query = uniqueQueryStr;
  }
  if (!query) {
    console.info('Query string is empty');
    return [];
  }
  const url = `${protocol}//${domain}/subject_search/${encodeURIComponent(query)}?cat=${type}`;
  console.info('search bangumi subject URL: ', url);
  const rawText = await fetchText(url);
  const rawInfoList = dealSearchResults(rawText)[0] || []
  // 使用指定搜索字符串如 ISBN 搜索时, 并且结果只有一条时，不再使用名称过滤
  if (uniqueQueryStr && rawInfoList && rawInfoList.length === 1) {
    return rawInfoList[0];
  }
  const options = {
    keys: [
      "name",
      "greyName"
    ]
  };
  return filterResults(rawInfoList, subjectInfo, options);
}

/**
 * 通过时间查找条目
 * @param subjectInfo
 * @param pageNumber
 * @param type
 */
// @ts-ignore
export async function findSubjectByDate(
  subjectInfo: Subject,
  pageNumber: number = 1,
  type: SubjectTypeEnum = SubjectTypeEnum.GAME
) {
  if (!subjectInfo || !subjectInfo.releaseDate || !subjectInfo.name) {
    throw new Error('invalid subject info');
  }
  const releaseDate = new Date(subjectInfo.releaseDate);
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
  const url = `${protocol}//${domain}/${type}/browser/airtime/${releaseDate.getFullYear()}-${releaseDate.getMonth() + 1}${query}`;
  console.info('find subject by date: ', url)
  const rawText = await fetchText(url)
  let [rawInfoList, numOfPage] = dealSearchResults(rawText);
  const options = {
    keys: [
      "name",
      "greyName"
    ]
  };
  let result = filterResults(rawInfoList, subjectInfo, options);
  if (!result) {
    if (pageNumber < numOfPage) {
      await sleep(300)
      return await findSubjectByDate(subjectInfo, pageNumber + 1, type)
    } else {
      throw 'notmatched';
    }
  }
  return result;
}

export async function checkBookSubjectExist(
  subjectInfo: BookSubject,
  type: SubjectTypeId
) {
  let searchResult = await searchSubject(subjectInfo, type, subjectInfo.isbn)
  console.info(`First: search result of bangumi: `, searchResult);
  if (searchResult && searchResult.url) {
    return searchResult;
  }
  searchResult = await searchResult(subjectInfo, type, subjectInfo.asin);
  console.info('Second: search result of bangumi: ', searchResult);
  if (searchResult && searchResult.url) {
    return searchResult;
  }
  // 默认使用名称搜索
  searchResult = await searchResult(subjectInfo, type);
  console.info('Third: search result of bangumi: ', searchResult);
  return searchResult;
}

export function changeDomain(
  originUrl: string,
  domain: BangumiDomain,
  protocol: Protocol = Protocol.https
): string {
  let url = originUrl;
  if (url.match(domain)) return url;
  let domainArr = [BangumiDomain.bangumi, BangumiDomain.chii, BangumiDomain.bgm]
  domainArr.splice(domainArr.indexOf(domain), 1)
  return url.replace(new RegExp(domainArr.join('|').replace('.', '\\.')), domain)
    .replace(/https?/, protocol);
}

