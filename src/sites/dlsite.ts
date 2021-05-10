import { SingleInfo } from '../interface/subject';
import { dealDate } from '../utils/utils';
import { SiteTools } from './types';

export const dlsiteTools: SiteTools = {
  hooks: {
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        let val = info.value;
        if (
          val &&
          typeof val === 'string' &&
          !/http/.test(val) &&
          ['原画', '剧本', '音乐', '游戏类型', '声优'].includes(info.name)
        ) {
          const v = info.value.split('/');
          if (v && v.length > 1) {
            val = v.map((s: string) => s.trim()).join(', ');
          }
        }
        res.push({
          ...info,
          value: val,
        });
      }
      return res;
    },
  },
  filters: [
    {
      category: 'date',
      dealFunc(str: string) {
        if (/年/.test(str)) {
          return dealDate(str.replace(/日.+$/, '日'));
        }
        return str;
      },
    },
  ],
};
