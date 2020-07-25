import {InfoConfig, Selector, SiteConfig, ModelKey} from '../interface/wiki';
import {findElement, getText} from '../utils/domUtils';
import {AllSubject, SearchResult, SingleInfo} from '../interface/subject';
import {getImageDataByURL} from '../utils/dealImage';
import {isEqualDate} from '../utils/utils';
import {dealFuncByCategory} from './dealUtils';

/**
 * 处理单项 wiki 信息
 * @param str
 * @param category
 * @param keyWords
 */
export function dealItemText(
  str: string,
  category: string = '',
  keyWords: string[] = []
): string {
  const separators = [':', '：'];
  if (['subject_summary', 'subject_title'].indexOf(category) !== -1) {
    return str;
  }
  const textList = ['\\(.*?\\)', '（.*?）']; // 去掉多余的括号信息
  // const keyStr = keyWords.sort((a, b) => b.length - a.length).join('|')
  // `(${keyStr})(${separators.join('|')})?`
  return str
    .replace(new RegExp(textList.join('|'), 'g'), '')
    .replace(new RegExp(keyWords.join('|')), '')
    .replace(new RegExp(`^.*?${separators.join('|')}`), '')
    .trim();
}

export async function getWikiItem(infoConfig: InfoConfig, site: ModelKey) {
  const sl = infoConfig.selector;
  let $d: Element;
  let targetSelector: Selector;
  if (sl instanceof Array) {
    let i = 0;
    targetSelector = sl[i];
    while (!($d = findElement(targetSelector)) && i < sl.length) {
      targetSelector = sl[++i];
    }
  } else {
    targetSelector = sl;
    $d = findElement(targetSelector);
  }
  if (!$d) return;
  let keyWords: string[];
  if (targetSelector.keyWord instanceof Array) {
    keyWords = targetSelector.keyWord;
  } else {
    keyWords = [targetSelector.keyWord];
  }
  let val: any;
  const txt = getText($d as HTMLElement);
  switch (infoConfig.category) {
    case 'cover':
      let url;
      if ($d.tagName.toLowerCase() === 'a') {
        url = $d.getAttribute('href');
        val = {
          url: url,
          dataUrl: url,
        };
      } else if ($d.tagName.toLowerCase() === 'img') {
        url = $d.getAttribute('src');
        val = {
          url: url,
          dataUrl: await getImageDataByURL(url),
          height: $d.clientHeight,
          width: $d.clientWidth,
        };
      }
      break;
    case 'alias':
    case 'subject_title':
      val = dealFuncByCategory(site, infoConfig.category)(txt);
      break;
    case 'website':
      val = dealFuncByCategory(site, 'website')($d.getAttribute('href'));
      break;
    case 'date':
      if (!['amazon_jp_book', 'getchu_game'].includes(site)) {
        val = dealFuncByCategory(site, infoConfig.category)(txt);
        break;
      }
    default:
      val = dealItemText(txt, infoConfig.category, keyWords);
  }
  if (val) {
    return {
      name: infoConfig.name,
      value: val,
      category: infoConfig.category,
    } as SingleInfo;
  }
}

export async function getWikiData(siteConfig: SiteConfig, el?: Document) {
  if (el) {
    window._parsedEl = el;
  } else {
    window._parsedEl = null;
  }
  const r = await Promise.all(
    siteConfig.itemList.map((item) => getWikiItem(item, siteConfig.key))
  );
  delete window._parsedEl;
  const defaultInfos = siteConfig.defaultInfos || [];
  return [...r.filter((i) => i), ...defaultInfos];
}

/**
 * 过滤搜索结果： 通过名称以及日期
 * @param items
 * @param subjectInfo
 * @param opts
 */
export function filterResults(
  items: SearchResult[],
  subjectInfo: AllSubject,
  opts: any = {},
  isSearch: boolean = true,
) {
  if (!items) return;
  // 只有一个结果时直接返回, 不再比较日期
  if (items.length === 1 && isSearch) {
    const result = items[0];
    return result;
    // if (isEqualDate(result.releaseDate, subjectInfo.releaseDate)) {
    // }
  }
  let results = new Fuse(
    items,
    Object.assign(
      {},
      opts
    )
  ).search(subjectInfo.name);
  if (!results.length) return;
  // 有参考的发布时间
  if (subjectInfo.releaseDate) {
    for (const item of results) {
      const result = item.item;
      if (result.releaseDate) {
        if (isEqualDate(result.releaseDate, subjectInfo.releaseDate)) {
          return result;
        }
      }
    }
  }
  // 比较名称
  const nameRe = new RegExp(subjectInfo.name.trim());
  for (const item of results) {
    const result = item.item;
    if (nameRe.test(result.name) || nameRe.test(result.greyName)) {
      return result;
    }
  }
  return results[0]?.item;
}

export function getQueryInfo(items: SingleInfo[]): any {
  let info: any = {};
  items.forEach((item) => {
    if (item.category === 'subject_title') {
      info.name = item.value;
    }
    if (item.category === 'date') {
      info.releaseDate = item.value;
    }
    if (item.category === 'ASIN') {
      info.asin = item.value;
    }
    if (item.category === 'ISBN') {
      info.isbn = item.value;
    }
  });
  return info;
}

/**
 * 插入控制的按钮
 * @param $t 父节点
 * @param cb 返回 Promise 的回调
 */
export function insertControlBtn(
  $t: Element,
  cb: (...args: any) => Promise<any>
) {
  if (!$t) return;
  const $s = document.createElement('span');
  $s.classList.add('e-wiki-new-subject');
  $s.innerHTML = '新建';
  const $search = $s.cloneNode() as Element;
  $search.innerHTML = '新建并查重';
  $t.appendChild($s);
  $t.appendChild($search);
  $s.addEventListener('click', async (e) => {
    await cb(e);
  });
  $search.addEventListener('click', async (e) => {
    if ($search.innerHTML !== '新建并查重') return;
    $search.innerHTML = '查重中...';
    try {
      await cb(e, true);
      $search.innerHTML = '新建并查重';
    } catch (e) {
      if (e === 'notmatched') {
        $search.innerHTML = '未查到条目';
      }
      console.error(e);
    }
  });
}

/**
 * 插入新建角色控制的按钮
 * @param $t 父节点
 * @param cb 返回 Promise 的回调
 */
export function insertControlBtnChara(
  $t: Element,
  cb: (...args: any) => Promise<any>
) {
  if (!$t) return;
  const $s = document.createElement('a');
  $s.classList.add('e-wiki-new-character');
  // $s.setAttribute('target', '_blank')
  $s.innerHTML = '添加新虚拟角色';
  $t.appendChild($s);
  $s.addEventListener('click', async (e) => {
    await cb(e);
  });
}
