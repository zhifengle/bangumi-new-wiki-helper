import {ModelKey} from '../interface/wiki';
import {getchuTools} from './getchu';
import {amazonTools} from './amazon';
import {dealDate, formatDate} from '../utils/utils';

type Utils = {
  [key in ModelKey]?: {
    category: string
    dealFunc: (...args: any) => string
  }[]
}
export const dealUtils: Utils = {
  steam_game: [
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
          return dealDate(str)
        }
        return formatDate(str);
      },

    },
  ],
  steamdb_game: [
    {
      category: 'date',
      dealFunc(str: string) {
        const arr = str.split('–');
        if (!arr[0]) return '';
        return formatDate(arr[0].trim());
      },
    },
  ],
  getchu_game: [
    {
      category: 'subject_title',
      dealFunc: getchuTools.dealTitle,
    },
  ],
  amazon_jp_book: [
    {
      category: 'subject_title',
      dealFunc: amazonTools.dealTitle,
    },
  ],
};

function identity<T>(x: T): T {
  return x;
}

export function dealFuncByCategory(
  key: ModelKey,
  category: string
): (...args: any) => string {
  let fn;
  if (dealUtils[key]) {
    const obj = dealUtils[key].find((x) => x.category === category);
    fn = obj && obj.dealFunc;
  }
  if (fn) {
    return fn;
  } else {
    return (str: string) => str.trim();
  }
}
