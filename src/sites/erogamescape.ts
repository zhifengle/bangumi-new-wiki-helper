import {AllSubject, SearchResult} from "../interface/subject";
import {fetchText} from "../utils/fetchData";
import {filterResults, getWikiData} from "./common";
import {getText} from "../utils/domUtils";
import {erogamescapeModel} from "../models/erogamescape";

enum ErogamescapeCategory {
  game = 'game',
  brand = 'brand',
  creater = 'creater',
  music = 'music',
  pov = 'pov',
  character = 'character',
}


function convertHost(type: 1 | 2) {
  if (type === 1) {
    return `https://erogamescape.dyndns.org`;
  } else {
    return `http://erogamescape.org`;
  }
}

const searchParam = {
  category: 'game',
  word_category: 'name',
  word: 'xx',  // +xxx
  mode: 'normal',  // okazu 可省略
};


export function dealSearchResults(info: string): [SearchResult[], number] | [] {
  const results: SearchResult[] = [];
  let $doc = (new DOMParser()).parseFromString(info, "text/html");
  let items = $doc.querySelectorAll('#result table tr');
  if (items && items.length > 1) {
    let nameIdx;
    let dateIdx;
    let countIdx;
    let scoreIdx;
    const headers = items[0].querySelectorAll('th');
    for (let i = 0, len = headers.length; i < len; i++) {
      const th = headers[i];
      const text = getText(th);
      if (/ゲーム名/.test(text)) {
        nameIdx = i;
      } else if (/発売日/.test(text)) {
        dateIdx = i;
      } else if (/中央値/.test(text)) {
        scoreIdx = i;
      } else if (/データ数/.test(text)) {
        countIdx = i;
      }
    }
    for (let idx = 1, len = items.length; idx < len; idx++) {
      const tds = items[idx].querySelectorAll('td');
      const nameTd = tds[nameIdx];
      if (!nameTd) continue;
      const nameTag = nameTd.querySelector('a');
      let result: SearchResult = {
        name: getText(nameTag),
        url: nameTag.getAttribute('href'),
      };
      if (dateIdx && tds[dateIdx]) {
        result.releaseDate = getText(tds[dateIdx]);
      }
      if (scoreIdx && tds[scoreIdx]) {
        result.score = getText(tds[scoreIdx]) || 0;
      }
      if (countIdx && tds[countIdx]) {
        result.count = getText(tds[countIdx]) || 0;
      }

      results.push(result);
    }
  } else {
    return [];
  }
  return [results, 0];
}


async function searchSubject(
  subjectInfo: AllSubject,
  host: string = 'https://erogamescape.dyndns.org',
  type: ErogamescapeCategory = ErogamescapeCategory.game,
  uniqueQueryStr: string = '') {
  let query = (subjectInfo.name || '').trim();
  if (uniqueQueryStr) {
    query = uniqueQueryStr;
  }
  if (!query) {
    console.info('Query string is empty');
    return [];
  }
  const url = `${host}/~ap2/ero/toukei_kaiseki/kensaku.php?category=game&word_category=name&word=${encodeURIComponent(name)}&mode=normal`;
  console.info('search subject URL: ', url);
  const rawText = await fetchText(url);
  const rawInfoList = dealSearchResults(rawText)[0] || [];
  return filterResults(rawInfoList, subjectInfo);
}

export async function getWebsite(
  result: SearchResult,
  host: string = 'https://erogamescape.dyndns.org',
) {
  const url = `${host}/~ap2/ero/toukei_kaiseki/${result.url}`;
  const rawText = await fetchText(url);
  let $doc = (new DOMParser()).parseFromString(rawText, "text/html");

  const d = await getWikiData(erogamescapeModel, $doc)
  const r = d.filter(item => item.category === 'website')
  if (r && r.length) {
    return r[0].value
  }
}


