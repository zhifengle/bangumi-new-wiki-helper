import { getStringValue, SingleInfo } from '../../interface/subjectInfo';
import { dealDate, formatDate } from '../../utils/utils';
import { SubjectTools } from '../catalogTypes';

export const steamTools: SubjectTools = {
  hooks: {
    async beforeCreate() {
      return {
        payload: {
          disableDate: true,
        },
      };
    },
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        const newInfo: SingleInfo = { ...info };
        if (info.name === 'website') {
          const arr = getStringValue(newInfo.value).split('?url=');
          newInfo.value = arr[1] || '';
          newInfo.category = 'website,listItem';
        }
        res.push({
          ...newInfo,
        });
      }
      if (location.hostname === 'store.steampowered.com') {
        res.push({
          name: '链接',
          value: `Steam|${location.origin + location.pathname}`,
          category: 'listItem',
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
          return dealDate(str.replace(/\s/g, ''));
        }
        return formatDate(str);
      },
    },
  ],
};


