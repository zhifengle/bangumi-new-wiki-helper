import { SiteConfig, ModelKey } from '../interface/wiki';
import { ITiming, IFuncPromise } from '../interface/types';
import { amazonTools } from './amazon';
import { dealDate, formatDate } from '../utils/utils';
import { getchuTools } from './getchu';
import { getImageDataByURL, convertImgToBase64 } from '../utils/dealImage';

type FuncDict = {
  hooks?: {
    beforeCreate?: IFuncPromise;
    afterCreate?: IFuncPromise;
  };
  filters?: {
    category: string;
    dealFunc: (...args: any) => string;
  }[];
};

export function trimParenthesis(str: string) {
  const textList = ['\\([^d]*?\\)', '（[^d]*?）']; // 去掉多余的括号信息
  return str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
}

export function identity<T>(x: T): T {
  return x;
}
const noOps = () => Promise.resolve();
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
    dataUrl = await getImageDataByURL(url);
  } else if ($d.tagName.toLowerCase() === 'img') {
    url = $d.getAttribute('src');
    // dataUrl = convertImgToBase64($d as any);
    dataUrl = await getImageDataByURL(url);
  }
  if (dataUrl) {
    return {
      dataUrl,
    };
  }
  return;
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
  [key in ModelKey]?: FuncDict;
} = {
  amazon_jp_book: {
    hooks: {
      async beforeCreate() {
        console.info('create');
      },
    },
    filters: [
      {
        category: 'subject_title',
        dealFunc: amazonTools.dealTitle,
      },
    ],
  },
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
  getchu_game: {
    filters: [
      {
        category: 'subject_title',
        dealFunc: getchuTools.dealTitle,
      },
    ],
  },
  steam_game: {
    filters: [
      {
        category: 'website',
        dealFunc(str: string) {
          // https://steamcommunity.com/linkfilter/?url=https://www.koeitecmoamerica.com/ryza/
          const arr = str.split('?url=');
          return arr[1] || '';
        },
      },
      {
        category: 'date',
        dealFunc(str: string) {
          if (/年/.test(str)) {
            return dealDate(str);
          }
          return formatDate(str);
        },
      },
    ],
  },
  steamdb_game: {
    filters: [
      {
        category: 'date',
        dealFunc(str: string) {
          const arr = str.split('–');
          if (!arr[0]) return '';
          return formatDate(arr[0].trim());
        },
      },
    ],
  },
};
