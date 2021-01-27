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
    async beforeCreate() {
      const $t = document.querySelector('#title');
      const bookTypeList = document.querySelectorAll(
        '#tmmSwatches ul > li.swatchElement'
      );
      if ($t && bookTypeList && bookTypeList.length > 1) {
        const $div = document.createElement('div');
        const $s = document.createElement('span');
        $s.style.color = 'red';
        $s.style.fontWeight = '600';
        $s.innerHTML = '注意: ';
        const $txt = document.createElement('span');
        $txt.innerHTML =
          '书籍存在多种版本，请优先选择实体书创建。(辅助创建脚本)';
        $div.appendChild($s);
        $div.appendChild($txt);
        $div.style.padding = '6px 0';
        $t.insertAdjacentElement('afterend', $div);
      }
      return true;
    },
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        let newInfo: null | SingleInfo = { ...info };
        if (info.name === '页数') {
          let val = (info.value || '').trim().replace(/ページ|页/, '');
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
