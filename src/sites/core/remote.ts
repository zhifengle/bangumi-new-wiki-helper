import { IFetchOpts } from '../../interface/types';
import { findModelByHost } from '../../sites';
import { findElement } from '../../utils/domUtils';
import { fetchText } from '../../utils/fetchData';
import {
  createRemoteWikiPageContext,
  createWikiExtractContext,
} from './context';
import { getWikiData } from './extract';

// 后台抓取其它网站的 wiki 信息
export async function getWikiDataByURL(url: string, opts: IFetchOpts = {}) {
  const urlObj = new URL(url);
  const models = findModelByHost(urlObj.hostname);
  if (models && models.length) {
    const rawText = await fetchText(url, opts, 4 * 1000);
    let $doc = new DOMParser().parseFromString(rawText, 'text/html');
    let model = models[0];
    if (models.length > 1) {
      for (const m of models) {
        if (m.urlRules && m.urlRules.some((r) => r.test(url))) {
          model = m;
        }
      }
    }
    try {
      // 查找标志性的元素
      const $page = findElement(model.pageSelectors, $doc);
      if (!$page) return [];
      const $title = findElement(model.controlSelector, $doc);
      if (!$title) return [];
      return await getWikiData(
        model,
        createWikiExtractContext($doc, createRemoteWikiPageContext(url))
      );
    } catch (error) {
      return [];
    }
  }
  return [];
}
