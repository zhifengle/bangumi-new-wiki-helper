import { dealDate } from '../utils/utils';
import { SiteTools } from './types';

export const dmmTools: SiteTools = {
  filters: [
    {
      category: 'date',
      dealFunc(str: string) {
        const re = /\d{4}\/\d{1,2}(\/\d{1,2})?/;
        const m = str.match(re);
        if (m) {
          return dealDate(m[0]);
        }
        return str;
      },
    },
  ],
};
