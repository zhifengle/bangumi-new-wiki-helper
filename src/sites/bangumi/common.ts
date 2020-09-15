import { dealDate } from '../../utils/utils';
import { fetchText } from '../../utils/fetchData';
import { sleep } from '../../utils/async/sleep';
import { SubjectItem } from '../../interface/types';

export function getBgmHost() {
  return `${location.protocol}//${location.host}`;
}

export function getSubjectId(url: string) {
  const m = url.match(/(?:subject|character)\/(\d+)/);
  if (!m) return '';
  return m[1];
}

export function genLinkText(url: string, text: string = '地址') {
  const $div = document.createElement('div');
  const $link = document.createElement('a');
  $link.href = url;
  $link.innerText = text;
  $div.appendChild($link);
  return $div.innerHTML;
}

export function insertLogInfo($sibling: Element, txt: string): Element {
  const $log = document.createElement('div');
  $log.classList.add('.e-wiki-log-info');
  $log.setAttribute('style', 'color: tomato;');
  $log.innerHTML = txt;
  $sibling.parentElement.insertBefore($log, $sibling);
  $sibling.insertAdjacentElement('afterend', $log);
  return $log;
}

export async function getFormhash() {
  const rawText = await fetchText(
    `${location.protocol}//${location.host}/new_subject/1`
  );
  let $doc = new DOMParser().parseFromString(rawText, 'text/html');
  let formhash = $doc
    .querySelector('input[name=formhash]')
    .getAttribute('value');
  return formhash;
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

function loadIframe($iframe: HTMLIFrameElement, subjectId: string) {
  return new Promise((resolve, reject) => {
    $iframe.src = `/update/${subjectId}`;
    let timer = setTimeout(() => {
      timer = null;
      reject('iframe timeout');
    }, 5000);
    $iframe.onload = () => {
      clearTimeout(timer);
      $iframe.onload = null;
      resolve();
    };
  });
}

export async function getFormAction(subjectId: string) {
  const iframeId = 'e-userjs-update-interest';
  let $iframe = document.querySelector(`#${iframeId}`) as HTMLIFrameElement;
  if (!$iframe) {
    $iframe = document.createElement('iframe');
    $iframe.style.display = 'none';
    $iframe.id = iframeId;
    document.body.appendChild($iframe);
  }
  await loadIframe($iframe, subjectId);
  const $form = $iframe.contentDocument.querySelector(
    '#collectBoxForm'
  ) as HTMLFormElement;
  return $form.action;
}

type IInterestData = {
  // 想看 看过 在看 搁置 抛弃
  interest: '1' | '2' | '3' | '4' | '5';
  tags?: string;
  comment?: string;
  rating?: string;
  // 1 为自己可见
  privacy?: '1' | '0';
};
/**
 * 更新用户收藏
 * @param subjectId 条目 id
 * @param data 更新数据
 */
export async function updateInterest(subjectId: string, data: IInterestData) {
  // gh 暂时不知道如何获取，直接拿 action 了
  const action = await getFormAction(subjectId);
  const formData = new FormData();
  const obj = Object.assign(
    { referer: 'ajax', tags: '', comment: '', upate: '保存' },
    data
  );
  for (let [key, val] of Object.entries(obj)) {
    formData.append(key, val);
  }
  await fetch(action, {
    method: 'POST',
    body: formData,
  });
}
