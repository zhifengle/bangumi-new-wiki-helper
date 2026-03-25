import { SingleInfo } from '../interface/subject';
import { getText } from '../utils/domUtils';
import { convertImgToBase64 } from '../utils/dealImage';
import { SiteTools } from './types';

export const getchuTools = {
  dealTitle(str: string): string {
    str = str.trim().split('\n')[0];
    str = str
      .split('＋')[0]
      .replace(/（このタイトルの関連商品）/, '')
      .trim();
    return str.replace(
      /\s[^ ]*?(スペシャルプライス版|限定版|通常版|廉価版|復刻版|初回.*?版|描き下ろし).*?$|＜.*＞$/g,
      ''
    );
  },
  getExtraCharaInfo(txt: string): SingleInfo[] {
    const re = /[^\s]+?[:：]/g;
    const matchedArr = txt.match(re);
    if (!matchedArr) return [];
    const infoArr = txt.split(re);
    const res: SingleInfo[] = [];
    matchedArr.forEach((item: string, idx: number) => {
      const val = (infoArr[idx + 1] || '').trim();
      if (val) {
        res.push({
          name: item.replace(/:|：/, ''),
          value: val,
        });
      }
    });
    return res;
  },
  getCharacterInfo($t: Element): SingleInfo[] {
    const charaData: SingleInfo[] = [];
    const $name = $t.closest('dt').querySelector('h2');
    let name;
    if ($name.querySelector('charalist')) {
      const $charalist = $name.querySelector('charalist') as HTMLElement;
      name = getText($charalist);
    } else {
      if ($name.classList.contains('chara-name') && $name.querySelector('br')) {
        name = $name
          .querySelector('br')
          .nextSibling.textContent.split(/（|\(|\sCV|新建角色/)[0];
      } else {
        name = getText($name as HTMLElement).split(/（|\(|\sCV|新建角色/)[0];
      }
    }
    charaData.push({
      name: '姓名',
      value: name.replace(/\s/g, ''),
      category: 'crt_name',
    });
    charaData.push({
      name: '日文名',
      value: name,
    });
    const nameTxt = getText($name as HTMLElement);
    if (nameTxt.match(/（(.*)）/)) {
      charaData.push({
        name: '纯假名',
        value: nameTxt.match(/（(.*)）/)[1],
      });
    }
    const cvMatch = nameTxt.match(/(?<=CV[：:]).+/);
    if (cvMatch) {
      charaData.push({
        name: 'CV',
        value: cvMatch[0].replace(/\s/g, ''),
      });
    }
    const $img = $t.closest('tr').querySelector('td > img');
    if ($img) {
      charaData.push({
        name: 'cover',
        value: convertImgToBase64($img as HTMLImageElement),
        category: 'crt_cover',
      });
    }

    // 处理杂项 参考 id=1074002 id=735329 id=1080370
    // id=1080431
    // id=840936
    // dd tag
    const $dd = $t.closest('dt').nextElementSibling;
    const $clonedDd = $dd.cloneNode(true) as HTMLElement;
    Array.prototype.forEach.call(
      $clonedDd.querySelectorAll('span[style^="font-weight"]'),
      (node: HTMLElement) => {
        const t = getText(node).trim();
        t.split(/\n/g).forEach((el: string) => {
          const extraInfo = getchuTools.getExtraCharaInfo(el);
          if (extraInfo.length) {
            charaData.push(...extraInfo);
          } else {
            const c = el.match(/B.*W.*H\d+/);
            if (c) {
              charaData.push({
                name: 'BWH',
                value: c[0],
              });
            }
          }
        });
        node.remove();
      }
    );

    charaData.push({
      name: '人物简介',
      value: getText($clonedDd).trim(),
      category: 'crt_summary',
    });
    const dict: any = {
      誕生日: '生日',
      '3サイズ': 'BWH',
      スリーサイズ: 'BWH',
      身長: '身高',
      血液型: '血型',
    };
    charaData.forEach((item) => {
      if (dict[item.name]) {
        item.name = dict[item.name];
      }
    });

    return charaData;
  },
};

export const getchuSiteTools: SiteTools = {
  hooks: {
    async beforeCreate() {
      const $t = document.querySelector('#soft-title');
      if (!$t) return false;
      const rawTitle = $t.textContent.trim();
      if (/［同人グッズ|同人誌|同人音楽］/.test(rawTitle)) return false;
      return true;
    },
  },
  filters: [
    {
      category: 'subject_title',
      dealFunc: getchuTools.dealTitle,
    },
  ],
};
