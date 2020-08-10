import { SiteConfig, ModelKey } from '../interface/wiki';
import { ITiming, IFuncPromise } from '../interface/types';
import { amazonUtils, amazonJpBookTools } from './amazon';
import { dealDate, formatDate } from '../utils/utils';
import { getchuTools } from './getchu';
import { getImageDataByURL } from '../utils/dealImage';
import { SiteTools } from './types';
import { doubanTools } from './douban';
import { steamTools, steamdbTools } from './steam';

export function trimParenthesis(str: string) {
  const textList = ['\\([^d]*?\\)', '（[^d]*?）']; // 去掉多余的括号信息
  return str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
}

export function identity<T>(x: T): T {
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
export async function getCover($d: Element, site: ModelKey) {
  let url;
  let dataUrl = '';
  if ($d.tagName.toLowerCase() === 'a') {
    url = $d.getAttribute('href');
  } else if ($d.tagName.toLowerCase() === 'img') {
    url = $d.getAttribute('src');
  }
  if (!url) return;
  try {
    // 跨域的图片不能用这种方式
    // dataUrl = convertImgToBase64($d as any);
    dataUrl = await getImageDataByURL(url);
    if (dataUrl) {
      return {
        url,
        dataUrl,
      };
    }
  } catch (error) {
    return {
      url,
      dataUrl: url,
    };
  }
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
    return (str: string) => identity(str.trim());
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
  getchu_game: {
    filters: [
      {
        category: 'subject_title',
        dealFunc: getchuTools.dealTitle,
      },
    ],
  },
  steam_game: steamTools,
  steamdb_game: steamdbTools,
  douban_game: doubanTools,
};
