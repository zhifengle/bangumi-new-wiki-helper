import { getStringValue, SingleInfo } from '../../interface/subjectInfo';
import { SiteTools } from '../catalogTypes';
import { amazonUtils, getAmazonCoverInfo } from '../amazon/shared';

export { amazonUtils } from '../amazon/shared';

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
        const stringValue = getStringValue(info.value);
        if (info.name === '页数') {
          const val = stringValue.trim().replace(/ページ|页/, '');
          if (val && val.length < 8 && val.indexOf('予約商品') === -1) {
            newInfo.value = val;
          } else {
            newInfo = null;
          }
        } else if (info.name === '播放时长') {
          newInfo.value = stringValue.replace('時間', '小时').replace(/ /g, '');
        } else if (info.name === '价格') {
          newInfo.value = stringValue.replace(/来自|より/, '').trim();
        }
        if (newInfo) {
          res.push({
            ...newInfo,
          });
        }
      }
      const coverInfo = await getAmazonCoverInfo(res);
      if (coverInfo) {
        res.push(coverInfo);
      }
      return res;
    },
  },
};


