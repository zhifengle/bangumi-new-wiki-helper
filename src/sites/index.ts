import { IFuncPromise, ITiming } from '../interface/types';
import {
  CharaModel,
  CharaModelKey,
  ModelKey,
  SiteConfig,
} from '../interface/wiki';
import { dealDate } from '../utils/utils';
import { adultComicTools } from './adultcomic';
import { amazonJpBookTools } from './amazon';
import { dlsiteCharaTools, dlsiteTools } from './dlsite';
import { dmmCharaTools, dmmTools } from './dmm';
import { doubanGameEditTools, doubanTools } from './douban';
import { erogamescapeTools } from './erogamescape';
import { getchuCharaTools, getchuSiteTools } from './getchu';
import { steamdbTools, steamTools } from './steam';
import { SiteTools } from './types';

export function trimParenthesis(str: string) {
  const textList = ['\\([^d]*?\\)', '（[^d]*?）']; // 去掉多余的括号信息
  return str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
}

function identity<T>(x: T): T {
  return x;
}
const noOps = () => Promise.resolve(true);

export function getHooks(
  siteConfig: SiteConfig,
  timing: ITiming
): IFuncPromise {
  const hooks: any = sitesFuncDict[siteConfig.key]?.hooks || {};
  return hooks[timing] || noOps;
}
export function getCharaHooks(
  config: CharaModel,
  timing: ITiming
): IFuncPromise {
  const hooks: any = charaFuncDict[config.key]?.hooks || {};
  return hooks[timing] || noOps;
}
export function dealFuncByCategory(
  key: ModelKey,
  category: string
): (...args: any) => string {
  let fn;
  if (sitesFuncDict[key]?.filters) {
    const obj = sitesFuncDict[key].filters.find((x) => x.category === category);
    fn = obj && obj.dealFunc;
  }
  if (fn) {
    return fn;
  } else {
    return (str: string = '') => identity(str.trim());
  }
}

export const sitesFuncDict: {
  [key in ModelKey]?: SiteTools;
} = {
  amazon_jp_book: amazonJpBookTools,
  dangdang_book: {
    filters: [
      {
        category: 'date',
        dealFunc(str: string) {
          return dealDate(str.replace(/出版时间[:：]/, '').trim());
        },
      },
      {
        category: 'subject_title',
        dealFunc(str: string) {
          return trimParenthesis(str);
        },
      },
    ],
  },
  jd_book: {
    filters: [
      {
        category: 'subject_title',
        dealFunc(str: string) {
          return trimParenthesis(str);
        },
      },
    ],
  },
  getchu_game: getchuSiteTools,
  erogamescape: erogamescapeTools,
  steam_game: steamTools,
  steamdb_game: steamdbTools,
  douban_game: doubanTools,
  douban_game_edit: doubanGameEditTools,
  dlsite_game: dlsiteTools,
  dmm_game: dmmTools,
  adultcomic: adultComicTools,
};

// 存储新建角色的钩子函数和 filters
export const charaFuncDict: {
  [key in CharaModelKey]?: SiteTools;
} = {
  dlsite_game_chara: dlsiteCharaTools,
  dmm_game_chara: dmmCharaTools,
  getchu_chara: getchuCharaTools,
};
