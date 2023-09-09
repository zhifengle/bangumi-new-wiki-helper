import { SingleInfo } from '../interface/subject';
import { getImageDataByURL } from '../utils/dealImage';
import { SiteTools } from './types';

export const amazonUtils = {
  dealTitle(str: string): string {
    str = str.trim().split('\n')[0].trim();
    // str = str.split(/\s[(（][^0-9)）]+?[)）]/)[0]
    // 去掉尾部括号的内容, (1) （1） 这类不处理
    const textList = [
      '\\([^0-9]+?\\)$',
      '（[^0-9]+?）$',
      '\\(.+?\\d+.+?\\)$', // 中间包含数字
      '（.+?\\d+.+?）$',
    ]; // 去掉多余的括号信息
    str = str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
    // return str.replace(/\s[(（][^0-9)）]+?[)）]$/g, '').trim();
    return str;
  },
  // 获取 URL 的 dp
  getUrlDp(str: string): string {
    const m = str.match(/\/dp\/(.*?)\//);
    if (m) {
      return m[1];
    }
    return '';
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
      const books = document.querySelectorAll('#tmmSwatches > .a-row div');
      if (
        $t &&
        ((bookTypeList && bookTypeList.length > 1) ||
          (books && books.length > 1))
      ) {
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
        // 没有简介时，使用 kindle 版本的介绍
        const $desc = document.querySelector(
          '#bookDescription_feature_div .a-expander-content'
        );
        if (!$desc) {
          const btns: NodeListOf<HTMLAnchorElement> = document.querySelectorAll(
            '#tmmSwatches ul > li.swatchElement .a-button-text'
          );
          if (btns && btns.length) {
            const url = Array.from(btns)
              .map((a) => a.href)
              .filter((h) => h.match(/^http/))[0];
            if (url) {
              return {
                payload: {
                  auxSite: {
                    url,
                    prefs: {
                      originNames: ['ISBN', '名称'],
                    },
                  },
                },
              };
            }
          }
        }
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
        } else if (info.name === '价格') {
          let val = (info.value || '').replace(/来自|より/, '').trim();
          newInfo.value = val;
        }
        if (newInfo) {
          res.push({
            ...newInfo,
          });
        }
      }
      const $cover = document.querySelector('#imgTagWrapperId>img');
      if ($cover && !res.find((obj) => obj.name === 'cover')) {
        const url = $cover.getAttribute('data-old-hires');
        let dataUrl = url;
        try {
          dataUrl = await getImageDataByURL(url);
        } catch (error) {}
        const info: SingleInfo = {
          category: 'cover',
          name: 'cover',
          value: {
            url,
            dataUrl,
          },
        };
        res.push(info);
      }
      return res;
    },
  },
};
