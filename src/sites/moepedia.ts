import { SingleInfo } from '../interface/subject';
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
