import { SingleInfo } from '../interface/subject';
import { SiteTools } from './types';

export const amazonUtils = {
  dealTitle(str: string): string {
    str = str.trim().split('\n')[0].trim();
    // str = str.split(/\s[(（][^0-9)）]+?[)）]/)[0]
    // 去掉尾部括号的内容, (1) （1） 这类不处理
    return str.replace(/\s[(（][^0-9)）]+?[)）]$/g, '').trim();
    // return str.replace(/(?:(\d+))(\)|）).*$/, '$1$2').trim();
  },
};

export const amazonJpBookTools: SiteTools = {
  filters: [
    {
      category: 'subject_title',
      dealFunc: amazonUtils.dealTitle,
    },
  ],
  hooks: {
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        let newInfo: null | SingleInfo = { ...info };
        if (info.name === '页数') {
          let val = (info.value || '').trim().replace('ページ', '');
          if (val && val.length < 8 && val.indexOf('予約商品') === -1) {
            newInfo.value = val;
          } else {
            newInfo = null;
          }
        }
        if (newInfo) {
          res.push({
            ...newInfo,
          });
        }
      }
      return res;
    },
  },
};
