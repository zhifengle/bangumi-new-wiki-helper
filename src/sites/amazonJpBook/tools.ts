import { SingleInfo } from '../../interface/subjectInfo';
import { SubjectTools } from '../catalogTypes';
import { amazonUtils, getAmazonCoverInfo } from '../amazon/shared';

export { amazonUtils } from '../amazon/shared';

export const amazonJpBookTools: SubjectTools = {
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
    async finalize(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        res.push({ ...info });
      }
      const coverInfo = await getAmazonCoverInfo(res);
      if (coverInfo) {
        res.push(coverInfo);
      }
      return res;
    },
  },
};


