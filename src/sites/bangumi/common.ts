import { dealDate } from '../../utils/utils';
import { fetchText } from '../../utils/fetchData';
import { sleep } from '../../utils/async/sleep';

interface SubjectItem {
  name: string;
  url: string;
  rawInfos: string;
  rank?: string;
  releaseDate?: string;
  greyName?: string;
  cover?: string;
  rateInfo?: {
    score?: number | string;
    count?: number | string;
  };
  collectInfo?: {
    date: string;
    score?: string;
    tags?: string;
    comment?: string;
  };
}
export function convertItemInfo($item: HTMLElement): SubjectItem {
  let $subjectTitle = $item.querySelector('h3>a.l');
  let itemSubject: SubjectItem = {
    name: $subjectTitle.textContent.trim(),
    rawInfos: $item.querySelector('.info').textContent.trim(),
    // url 没有协议和域名
    url: $subjectTitle.getAttribute('href'),
    greyName: $item.querySelector('h3>.grey')
      ? $item.querySelector('h3>.grey').textContent.trim()
      : '',
  };
  let matchDate = $item
    .querySelector('.info')
    .textContent.match(/\d{4}[\-\/\年]\d{1,2}[\-\/\月]\d{1,2}/);
  if (matchDate) {
    itemSubject.releaseDate = dealDate(matchDate[0]);
  }
  const $rateInfo = $item.querySelector('.rateInfo');
  if ($rateInfo) {
    const rateInfo: any = {};
    if ($rateInfo.querySelector('.fade')) {
      rateInfo.score = $rateInfo.querySelector('.fade').textContent;
      rateInfo.count = $rateInfo
        .querySelector('.tip_j')
        .textContent.replace(/[^0-9]/g, '');
    } else {
      rateInfo.score = '0';
      rateInfo.count = '少于10';
    }
    itemSubject.rateInfo = rateInfo;
  }
  const $rank = $item.querySelector('.rank');
  if ($rank) {
    itemSubject.rank = $rank.textContent.replace('Rank', '').trim();
  }
  const $collectInfo = $item.querySelector('.collectInfo');
  if ($collectInfo) {
    const collectInfo: any = {};
    const textArr = $collectInfo.textContent.split('/');
    collectInfo.date = textArr[0].trim();
    textArr.forEach((str) => {
      if (str.match('标签')) {
        collectInfo.tags = str.replace(/标签:/, '').trim();
      }
    });
    const $comment = $item.querySelector('#comment_box');
    if ($comment) {
      collectInfo.comment = $comment.textContent.trim();
    }
    const $starlight = $collectInfo.querySelector('.starlight');
    if ($starlight) {
      $starlight.classList.forEach((s) => {
        if (/stars\d/.test(s)) {
          collectInfo.score = s.replace('stars', '');
        }
      });
    }
    itemSubject.collectInfo = collectInfo;
  }
  const $cover = $item.querySelector('.subjectCover img');
  if ($cover && $cover.tagName.toLowerCase() === 'img') {
    // 替换 cover/s --->  cover/l 是大图
    const src = $cover.getAttribute('src') || $cover.getAttribute('data-cfsrc');
    if (src) {
      itemSubject.cover = src.replace('pic/cover/s', 'pic/cover/l');
    }
  }
  return itemSubject;
}

export function getItemInfos($doc: Document | Element = document) {
  const items = $doc.querySelectorAll('#browserItemList>li');
  const res = [];
  for (const item of Array.from(items)) {
    res.push(convertItemInfo(item as HTMLElement));
  }
  return res;
}

export function getTotalPageNum($doc: Document | Element = document) {
  const $multipage = $doc.querySelector('#multipage');
  let totalPageNum = 1;
  const pList = $multipage.querySelectorAll('.page_inner>.p');
  if (pList && pList.length) {
    let tempNum = parseInt(
      pList[pList.length - 2].getAttribute('href').match(/page=(\d*)/)[1]
    );
    totalPageNum = parseInt(
      pList[pList.length - 1].getAttribute('href').match(/page=(\d*)/)[1]
    );
    totalPageNum = totalPageNum > tempNum ? totalPageNum : tempNum;
  }
  return totalPageNum;
}

export async function getAllPageInfo(url: string) {
  const rawText = await fetchText(url);
  const $doc = new DOMParser().parseFromString(rawText, 'text/html');
  const totalPageNum = getTotalPageNum($doc);
  const res = [...getItemInfos($doc)];
  let page = 2;
  while (page <= totalPageNum) {
    let reqUrl = url;
    const m = url.match(/page=(\d*)/);
    if (m) {
      reqUrl = reqUrl.replace(m[0], `page=${page}`);
    } else {
      reqUrl = `${reqUrl}?page=${page}`;
    }
    await sleep(500);
    console.info('fetch info: ', reqUrl);
    const rawText = await fetchText(reqUrl);
    const $doc = new DOMParser().parseFromString(rawText, 'text/html');
    res.push(...getItemInfos($doc));
    page += 1;
  }
  return res;
}
