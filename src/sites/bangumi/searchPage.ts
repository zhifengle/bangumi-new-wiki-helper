import { dealDate } from '../../utils/utils';
import { fetchText } from '../../utils/fetchData';
import { sleep } from '../../utils/async/sleep';
import { SubjectItem } from '../../interface/types';

type SubjectRateInfo = NonNullable<SubjectItem['rateInfo']>;
type SubjectCollectInfo = NonNullable<SubjectItem['collectInfo']>;

export function convertItemInfo($item: HTMLElement): SubjectItem {
  const $subjectTitle = $item.querySelector<HTMLAnchorElement>('h3>a.l');
  const infoText = $item.querySelector<HTMLElement>('.info')?.textContent?.trim() ?? '';
  const itemSubject: SubjectItem = {
    name: $subjectTitle?.textContent?.trim() ?? '',
    rawInfos: infoText,
    // url 没有协议和域名
    url: $subjectTitle?.getAttribute('href') ?? '',
    greyName: $item.querySelector<HTMLElement>('h3>.grey')?.textContent?.trim() ?? '',
  };
  const matchDate = infoText.match(/\d{4}[\-\/\年]\d{1,2}[\-\/\月]\d{1,2}/);
  if (matchDate) {
    itemSubject.releaseDate = dealDate(matchDate[0]);
  }
  const $rateInfo = $item.querySelector<HTMLElement>('.rateInfo');
  if ($rateInfo) {
    const rateInfo: SubjectRateInfo = {};
    const $score = $rateInfo.querySelector<HTMLElement>('.fade');
    const $count = $rateInfo.querySelector<HTMLElement>('.tip_j');
    if ($score && $count) {
      rateInfo.score = $score.textContent ?? '';
      rateInfo.count = $count.textContent?.replace(/[^0-9]/g, '') ?? '';
    } else {
      rateInfo.score = '0';
      rateInfo.count = '少于10';
    }
    itemSubject.rateInfo = rateInfo;
  }
  const $rank = $item.querySelector<HTMLElement>('.rank');
  if ($rank) {
    itemSubject.rank = $rank.textContent?.replace('Rank', '').trim();
  }
  const $collectInfo = $item.querySelector<HTMLElement>('.collectInfo');
  if ($collectInfo) {
    const collectInfo: SubjectCollectInfo = {
      date: '',
    };
    const textArr = ($collectInfo.textContent ?? '').split('/');
    collectInfo.date = textArr[0]?.trim() ?? '';
    textArr.forEach((str) => {
      if (str.match('标签')) {
        collectInfo.tags = str.replace(/标签:/, '').trim();
      }
    });
    const $comment = $item.querySelector<HTMLElement>('#comment_box');
    if ($comment) {
      collectInfo.comment = $comment.textContent?.trim();
    }
    const $starlight = $collectInfo.querySelector<HTMLElement>('.starlight');
    if ($starlight) {
      $starlight.classList.forEach((s) => {
        if (/stars\d/.test(s)) {
          collectInfo.score = s.replace('stars', '');
        }
      });
    }
    itemSubject.collectInfo = collectInfo;
  }
  const $cover = $item.querySelector<HTMLImageElement>('.subjectCover img');
  if ($cover && $cover.tagName.toLowerCase() === 'img') {
    // 替换 cover/s --->  cover/l 是大图
    const src = $cover.getAttribute('src') || $cover.getAttribute('data-cfsrc');
    if (src) {
      itemSubject.cover = src.replace('pic/cover/s', 'pic/cover/l');
    }
  }
  return itemSubject;
}

export function getItemInfos($doc: Document | Element = document): SubjectItem[] {
  const items = $doc.querySelectorAll('#browserItemList>li');
  const res: SubjectItem[] = [];
  for (const item of Array.from(items)) {
    res.push(convertItemInfo(item as HTMLElement));
  }
  return res;
}

export function getTotalPageNum($doc: Document | Element = document) {
  const $multipage = $doc.querySelector('#multipage');
  if (!$multipage) {
    return 1;
  }
  let totalPageNum = 1;
  const pList = $multipage.querySelectorAll<HTMLAnchorElement>('.page_inner>.p');
  if (pList.length >= 2) {
    const secondLastMatch = pList[pList.length - 2].href.match(/page=(\d*)/);
    const lastMatch = pList[pList.length - 1].href.match(/page=(\d*)/);
    const tempNum = Number.parseInt(secondLastMatch?.[1] ?? '1', 10);
    totalPageNum = Number.parseInt(lastMatch?.[1] ?? '1', 10);
    totalPageNum = totalPageNum > tempNum ? totalPageNum : tempNum;
  }
  return totalPageNum;
}

export async function getAllPageInfo(url: string): Promise<SubjectItem[]> {
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
