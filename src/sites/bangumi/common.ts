import { dealDate } from '../../utils/utils';
import { fetchText } from '../../utils/fetchData';
import { sleep } from '../../utils/async/sleep';
import { SubjectItem } from '../../interface/types';
import { loadIframe } from '../../utils/domUtils';

type SubjectRateInfo = NonNullable<SubjectItem['rateInfo']>;
type SubjectCollectInfo = NonNullable<SubjectItem['collectInfo']>;

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
  $log.classList.add('e-wiki-log-info');
  // $log.setAttribute('style', 'color: tomato;');
  $log.innerHTML = txt;
  if ($sibling.parentElement) {
    $sibling.parentElement.insertBefore($log, $sibling.nextElementSibling);
  }
  return $log;
}

export async function getFormhash(): Promise<string> {
  const rawText = await fetchText(
    `${location.protocol}//${location.host}/new_subject/1`
  );
  const $doc = new DOMParser().parseFromString(rawText, 'text/html');
  return $doc.querySelector<HTMLInputElement>('input[name=formhash]')?.value ?? '';
}

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
  const $form = await getFormByIframe(
    `/update/${subjectId}`,
    '#collectBoxForm'
  );
  const formData = new FormData($form);
  const obj = Object.assign(
    { referer: 'ajax', tags: '', comment: '', update: '保存' },
    data
  );
  for (let [key, val] of Object.entries(obj)) {
    if (!formData.has(key)) {
      formData.append(key, val);
    }
  }
  return await fetch($form.action, {
    method: 'POST',
    body: formData,
  });
}
/**
 * 通过 iframe 获取表单
 * @param url 链接地址
 * @param formSelector 表单的 iframe
 * @returns Promise<HTMLFormElement>
 */
export async function getFormByIframe(url: string, formSelector: string) {
  const iframeId = 'e-userjs-iframe';
  let $iframe = document.querySelector<HTMLIFrameElement>(`#${iframeId}`);
  if (!$iframe) {
    $iframe = document.createElement('iframe');
    $iframe.style.display = 'none';
    $iframe.id = iframeId;
    document.body.appendChild($iframe);
  }
  await loadIframe($iframe, url, 20000);
  const $form = $iframe.contentDocument?.querySelector<HTMLFormElement>(formSelector);
  if (!$form) {
    throw new Error(`form not found: ${formSelector}`);
  }
  return $form;
}
