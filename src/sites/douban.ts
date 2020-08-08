import { SiteTools } from './types';
import { SingleInfo } from '../interface/subject';

export const doubanTools: SiteTools = {
  hooks: {
    async beforeCreate() {
      return /\/game\//.test(window.location.href);
    },
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      infos.forEach((info) => {
        if (['平台', '别名'].includes(info.name)) {
          const pArr = info.value.split('/').map((i: string) => {
            return {
              ...info,
              value: i.trim(),
            };
          });
          res.push(...pArr);
        } else if (info.category === 'cover') {
          res.push({ ...info });
        } else {
          let val = info.value;
          if (val && typeof val === 'string') {
            const v = info.value.split('/');
            if (v && v.length > 1) {
              val = v.map((s: string) => s.trim()).join(',');
            }
          }
          res.push({
            ...info,
            value: val,
          });
        }
      });
      return res;
    },
  },
  filters: [],
};
