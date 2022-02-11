import { SingleInfo } from '../interface/subject';
import { IFuncPromise, IMsgPayload } from '../interface/types';
import { InfoConfig, Selector, SiteConfig } from '../interface/wiki';
import { findElement, getText } from '../utils/domUtils';
import { identity } from '../utils/utils';

type RawDom = { val: Element; keyWords: string[] };
type RawInfo = InfoConfig & { val: Element; keyWords: string[] };
type MyFilters = { category: string; dealFunc: (...args: any) => string };

// 有些关键字信息混在字符串里面，需要过滤掉
function getRawDom(infoConfig: InfoConfig): RawDom {
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
  return {
    val: $d,
    keyWords,
  };
}

function getRawInfos(site: IInfoSite): RawInfo[] {
  return site
    .getInfoConfigs()
    .map((item) => {
      const val = this.getRawDom(item);
      if (val) {
        return {
          ...item,
          ...val,
        };
      }
    })
    .filter((i) => i);
}

export interface IInfoSite {
  config: SiteConfig;
  filters: MyFilters[];

  isValidPage: () => boolean;
  beforeCreate?: () => Promise<boolean | { payload?: IMsgPayload }>;
  afterCreate?: IFuncPromise;
  afterGetWikiData?: IFuncPromise;
  getFilter: (s: string) => (...args: any) => string;
  getInfoConfigs: () => InfoConfig[];
}

export class InfoSite implements IInfoSite {
  config: SiteConfig;
  filters: MyFilters[];

  constructor(config: SiteConfig, filters: MyFilters[] = []) {
    this.config = config;
    this.filters = filters;
  }

  async beforeCreate(): Promise<boolean | { payload?: IMsgPayload }> {
    return true;
  }
  async afterGetWikiData(infos: SingleInfo[]) {
    // let results: SingleInfo[] = [];
    return infos;
  }

  getFilter(cat: string) {
    const f = this.filters.find((f) => f.category === cat);
    if (f) {
      return f.dealFunc;
    }
    return (s: string = '') => identity(s.trim());
  }

  isValidPage() {
    const $page = findElement(this.config.pageSelectors);
    if (!$page) return false;
    const $title = findElement(this.config.controlSelector);
    if (!$title) return false;
    return true;
  }
  getInfoConfigs() {
    return this.config.itemList;
  }
}
