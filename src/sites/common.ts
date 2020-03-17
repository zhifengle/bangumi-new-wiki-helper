import {InfoConfig, Selector} from "../interface/wiki";
import {findElement, getText} from "../utils/domUtils";
import {
  SingleInfo
} from "../interface/subject";
import {getchuTools} from "./getchu";
import {dealDate} from "../utils/utils";

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
  const separators = [':', '：']
  if (['subject_summary', 'subject_title'].indexOf(category) !== -1) {
    return str;
  }
  // TODO: game book title
  if (category === 'subject_title') {
    return str.replace(/(?:(\d+))(\)|）).*$/, '$1$2').trim();
  }
  const textList = ['\\(.*?\\)', '（.*?）']; // 去掉多余的括号信息
  // const keyStr = keyWords.sort((a, b) => b.length - a.length).join('|')
  // `(${keyStr})(${separators.join('|')})?`
  return str.replace(new RegExp(textList.join('|'), 'g'), '')
    .replace(new RegExp(keyWords.join('|')), '')
    .replace(new RegExp(`^.*?${separators.join('|')}`), '')
    .trim();
}

export function getWikiItem(infoConfig: InfoConfig, site: string): SingleInfo | void {
  const sl = infoConfig.selector
  let $d: Element;
  let targetSelector: Selector
  if (sl instanceof Array) {
    let i = 0;
    targetSelector = sl[i]
    while (!($d = findElement(targetSelector)) && i < sl.length) {
      targetSelector = sl[++i]
    }
  } else {
    targetSelector = sl
    $d = findElement(targetSelector)
  }
  if (!$d) return;
  let keyWords: string[]
  if (targetSelector.keyWord instanceof Array) {
    keyWords = targetSelector.keyWord
  } else {
    keyWords = [targetSelector.keyWord]
  }
  let val: any;
  if ('cover' === infoConfig.category) {
    val = {
      url: $d.getAttribute('src'),
      height: $d.clientHeight,
      width: $d.clientWidth,
    }
  }
  val = getText($d as HTMLElement)
  if ('subject_title' === infoConfig.category) {
    if (site === 'getchu_game') {
      val = getchuTools.dealTitle(val)
    } else if (site == 'amazon_jp_book') {
      // TODO
    }
  } else {
    val = dealItemText(val, infoConfig.category, keyWords)
  }
  if (val) {
    return {
      name: infoConfig.name,
      value: val,
      category: infoConfig.category
    } as SingleInfo
  }
}


export function getQueryInfo(items: SingleInfo[]) : any {
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
  const $s = document.createElement("span");
  $s.classList.add("e-wiki-new-subject");
  $s.innerHTML = "新建";
  const $search = $s.cloneNode() as Element;
  $search.innerHTML = "新建并查重";
  $t.appendChild($s);
  $t.appendChild($search);
  $s.addEventListener("click", async (e) => {
    await cb(e)
  });
  $search.addEventListener("click", async e => {
    if ($search.innerHTML !== "新建并查重") return;
    $search.innerHTML = "查重中...";
    await cb(e, true);
    $search.innerHTML = "新建并查重";
  });
}


export function dealInfoList() {
}
