import { SingleInfo } from '../interface/subject';
import { findElement } from '../utils/domUtils';
import { SiteTools } from './types';

function dealTitle(str: string): string {
  str = str.trim().split('\n')[0];
  return str.replace(
    /\s[^ ]*?(スペシャルプライス版|限定版|通常版|廉価版|復刻版|初回.*?版|描き下ろし|パッケージ版).*?$|＜.*＞$/g,
    ''
  );
}
export const moepediaTools: SiteTools = {
  hooks: {
    async beforeCreate() {
      const $el = findElement([
        {
          selector:
            '.body-shop_list > .body-shop_item > a[href*="www.getchu.com/soft.phtml?id="]',
        },
      ]);
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
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        let val = info.value;
        if (info.name === '游戏名') {
          val = dealTitle(val);
        } else if (
          ['原画', '剧本', '音乐', '主题歌演唱', '游戏类型'].includes(info.name)
        ) {
          val = val.replace(/\n\s*/g, ', ');
        } else if (info.name === '售价') {
          val = val.replace(/.*¥/, '¥');
        }
        res.push({
          ...info,
          value: val,
        });
      }
      return res;
    },
  },
};
