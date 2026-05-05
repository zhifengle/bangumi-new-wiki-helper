import { SingleInfo } from '../../interface/subjectInfo';
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
    async finalize(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        const newInfo: SingleInfo = { ...info };
        res.push({
          ...newInfo,
        });
      }
      if (location.hostname === 'store.steampowered.com') {
        res.push({
          name: 'website',
          value: `Steam|${location.origin + location.pathname}`,
          category: 'website,listItem',
        });
      }
      return res;
    },
  },
};


