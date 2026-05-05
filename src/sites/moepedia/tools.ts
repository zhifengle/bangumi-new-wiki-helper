import { SingleInfo } from '../../interface/subjectInfo';
import { SubjectTools } from '../catalogTypes';

export function dealTitle(str: string): string {
  str = str.trim().split('\n')[0];
  return str.replace(
    /\s[^ ]*?(スペシャルプライス版|限定版|通常版|廉価版|復刻版|初回.*?版|描き下ろし|パッケージ版).*?$|＜.*＞$/g,
    ''
  );
}
export const moepediaTools: SubjectTools = {
  hooks: {
    async beforeCreate() {
      const $el = document.querySelector<HTMLAnchorElement>(
        '.body-shop_list > .body-shop_item > a[href*="www.getchu.com/soft.phtml?id="]'
      );
      const url = $el?.getAttribute('href');
      if (url) {
        return {
          payload: {
            auxSite: {
              url,
              opts: {
                cookie: 'getchu_adalt_flag=getchu.com',
                decode: 'EUC-JP',
              },
              prefs: {
                originNames: ['游戏名'],
                targetNames: ['游戏简介'],
              },
            },
          },
        };
      }
      return true;
    },
    async finalize(infos: SingleInfo[]) {
      const normalizedLineNames = new Set([
        '原画',
        '剧本',
        '音乐',
        '主题歌演唱',
        '游戏类型',
      ]);

      return infos.map((info) => {
        if (typeof info.value !== 'string') return info;

        let value = info.value;
        if (info.name === '游戏名') {
          value = dealTitle(value);
        } else if (normalizedLineNames.has(info.name)) {
          value = value.replace(/\n\s*/g, ', ');
        } else if (info.name === '售价') {
          value = value.replace(/.*¥/, '¥');
        }

        return {
          ...info,
          value,
        };
      });
    },
  },
};


