import {AllSubject, BookSubject, SearchResult} from '../../interface/subject'
import {sleep} from "../../utils/async/sleep";
import {fetchText} from "../../utils/fetchData";
import {SubjectTypeId} from "../../interface/wiki";
import {dealDate, isEqualDate} from "../../utils/utils";

enum SubjectTypeEnum {
  GAME = "game",
  ANIME = "anime",
  MUSIC = "music",
  BOOK = "book",
  REAL = "real"
}
const subjectTypeDict = {
  [SubjectTypeId.game]: 'game',
  [SubjectTypeId.anime]: "anime",
  [SubjectTypeId.music]: "music",
  [SubjectTypeId.book]: "book",
  [SubjectTypeId.real]: "real",
  [SubjectTypeId.all]: "all",
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
        // url 没有协议和域名
        url: $subjectTitle.getAttribute('href'),
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
  // 只有一个结果时只比较日期
  if (items.length === 1) {
    const result = items[0]
    if (isEqualDate(result.releaseDate, subjectInfo.releaseDate)) {
      return result;
    }
  }
  let results = new Fuse(items, Object.assign({
    shouldSort: true,
    threshold: 0.6,
    location: 0,
    distance: 100,
    minMatchCharLength: 1,
  }, opts))
    .search(subjectInfo.name);
  if (!results.length) return;
  // 有参考的发布时间
  if (subjectInfo.releaseDate) {
    for (const result of results) {
      if (result.releaseDate) {
        if (isEqualDate(result.releaseDate, subjectInfo.releaseDate)) {
          return result;
        }
      }
    }
  }
  // 比较名称
  const nameRe = new RegExp(subjectInfo.name.trim());
  for (const result of results) {
    if (nameRe.test(result.name) || nameRe.test(result.greyName)) {
      return result;
    }
  }
  return results[0];
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
  uniqueQueryStr: string = '') {
  let releaseDate: string
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
    query = `"${uniqueQueryStr}"`;
  }
  if (!query) {
    console.info('Query string is empty');
    return [];
  }
  const url = `${bgmHost}/subject_search/${encodeURIComponent(query)}?cat=${type}`;
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
export async function findSubjectByDate(
  subjectInfo: AllSubject,
  bgmHost: string = 'https://bgm.tv',
  pageNumber: number = 1,
  type: string
) : Promise<SearchResult> {
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
  const url = `${bgmHost}/${type}/browser/airtime/${releaseDate.getFullYear()}-${releaseDate.getMonth() + 1}${query}`;
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
      return await findSubjectByDate( subjectInfo, bgmHost, pageNumber + 1, type)
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
  let searchResult = await searchSubject(subjectInfo, bgmHost, type, subjectInfo.isbn)
  console.info(`First: search result of bangumi: `, searchResult);
  if (searchResult && searchResult.url) {
    return searchResult;
  }
  searchResult = await searchSubject(subjectInfo, bgmHost, type, subjectInfo.asin);
  console.info('Second: search result of bangumi: ', searchResult);
  if (searchResult && searchResult.url) {
    return searchResult;
  }
  // 默认使用名称搜索
  searchResult = await searchSubject(subjectInfo, bgmHost, type);
  console.info('Third: search result of bangumi: ', searchResult);
  return searchResult;
}

async function checkExist(
  subjectInfo: AllSubject,
  bgmHost: string = 'https://bgm.tv',
  type: SubjectTypeId
) {
  let searchResult = await searchSubject(subjectInfo, bgmHost, type)
  console.info(`First: search result of bangumi: `, searchResult);
  if (searchResult && searchResult.url) {
    return searchResult;
  }
  searchResult = await findSubjectByDate(
    subjectInfo, bgmHost, 1, subjectTypeDict[type]
  )
  console.info(`Second: search result by date: `, searchResult);
  return searchResult;
}

export async function checkSubjectExit(
  subjectInfo: AllSubject,
  bgmHost: string = 'https://bgm.tv',
  type: SubjectTypeId
) {
  let result;
  switch (type) {
    case SubjectTypeId.book:
      result = await checkBookSubjectExist(
        subjectInfo as BookSubject,
        bgmHost,
        type
      )
      break;
    case SubjectTypeId.game:
      result = await checkExist(subjectInfo, bgmHost, type)
      break;
    case SubjectTypeId.anime:
    case SubjectTypeId.real:
    case SubjectTypeId.music:
    default:
      console.info('not support type: ', type)
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
  let domainArr = [BangumiDomain.bangumi, BangumiDomain.chii, BangumiDomain.bgm]
  domainArr.splice(domainArr.indexOf(domain), 1)
  return url.replace(new RegExp(domainArr.join('|').replace('.', '\\.')), domain)
    .replace(/https?/, protocol);
}

