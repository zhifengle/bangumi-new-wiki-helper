import { getStringValue, SingleInfo } from '../../interface/subject';
import {
  CharaModel,
  InfoConfig,
  ModelKey,
  Selector,
  SiteConfig,
} from '../../interface/wiki';
import {
  clearCtxDom,
  findElement,
  getInnerText,
  getText,
  setCtxDom,
} from '../../utils/domUtils';
import { dealTextByPipe } from '../../utils/textPipe';
import { getCover } from '../lib';
import { dealFuncByCategory, getCharaHooks, getHooks } from './compat';
import { WikiPageContext } from './context';

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
    .replace(
      new RegExp(keyWords.map((k) => `${k}\s*?(:|：)?`).join('|'), 'g'),
      ''
    )
    .replace(/[^\d:]+?(:|：)/, '')
    .trim();
}

export async function getWikiItem(
  infoConfig: InfoConfig,
  site: ModelKey,
  context: WikiPageContext = {}
) {
  if (!infoConfig) return;
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
  let val: SingleInfo['value'] | undefined;
  let txt = getText($d as HTMLElement);
  if (infoConfig.pipes?.includes('ti')) {
    txt = getInnerText($d as HTMLElement);
  }
  const pipeArgsDict = {
    k: [keyWords],
  };
  switch (infoConfig.category) {
    case 'cover':
    case 'crt_cover':
      val = await getCover($d, site, context);
      break;
    case 'subject_summary':
      // 优先使用 innerText
      const innerTxt = getInnerText($d as HTMLElement);
      if (innerTxt) {
        txt = innerTxt;
      }
    case 'alias':
    case 'subject_title':
      // 有管道优先使用管道处理数据. 兼容之前使用写法
      if (infoConfig.pipes) {
        val = dealTextByPipe(txt, infoConfig.pipes, pipeArgsDict);
      } else {
        val = dealFuncByCategory(site, infoConfig.category)(txt);
      }
      break;
    case 'website':
      val = dealFuncByCategory(site, 'website')($d.getAttribute('href'));
      break;
    case 'date':
      // 有管道优先使用管道处理数据. 兼容之前使用写法
      if (infoConfig.pipes) {
        val = dealTextByPipe(txt, infoConfig.pipes, pipeArgsDict);
      } else {
        // 日期预处理，不能删除
        val = dealItemText(txt, infoConfig.category, keyWords);
        val = dealFuncByCategory(site, infoConfig.category)(val);
      }
      break;
    default:
      // 有管道优先使用管道处理数据. 兼容之前使用写法
      if (infoConfig.pipes) {
        val = dealTextByPipe(txt, infoConfig.pipes, pipeArgsDict);
      } else {
        val = dealItemText(txt, infoConfig.category, keyWords);
      }
  }
  // 信息后处理
  if (infoConfig.category === 'creator') {
    val = getStringValue(val).replace(/\s/g, '');
  }
  if (val) {
    return {
      name: infoConfig.name,
      value: val,
      category: infoConfig.category,
    } as SingleInfo;
  }
}

export async function getWikiData(
  siteConfig: SiteConfig,
  el?: Document,
  context: WikiPageContext = {}
) {
  el ? setCtxDom(el) : clearCtxDom();
  const r = await Promise.all(
    siteConfig.itemList.map((item) => getWikiItem(item, siteConfig.key, context))
  );
  clearCtxDom();
  const defaultInfos = siteConfig.defaultInfos || [];
  let rawInfo = r.filter((i) => i);
  const hookRes = await getHooks(siteConfig, 'afterGetWikiData')(
    rawInfo,
    siteConfig
  );
  if (Array.isArray(hookRes) && hookRes.length) {
    rawInfo = hookRes;
  }
  return [...rawInfo, ...defaultInfos];
}

export async function getCharaData(
  model: CharaModel,
  el?: Document | Element,
  context: WikiPageContext = {}
) {
  el ? setCtxDom(el) : clearCtxDom();
  const r = await Promise.all(
    model.itemList.map((item) => getWikiItem(item, model.key, context))
  );
  clearCtxDom();
  const defaultInfos = model.defaultInfos || [];
  let rawInfo = r.filter((i) => i);
  const hookRes = await getCharaHooks(model, 'afterGetWikiData')(
    rawInfo,
    model,
    el
  );
  if (Array.isArray(hookRes) && hookRes.length) {
    rawInfo = hookRes;
  }
  return [...rawInfo, ...defaultInfos];
}
