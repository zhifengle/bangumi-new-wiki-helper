import { SiteTools } from '../catalogTypes';
import { trimParenthesis } from '../core/trim';

export const jdBookTools: SiteTools = {
  filters: [
    {
      category: 'subject_title',
      dealFunc(str: string) {
        return trimParenthesis(str);
      },
    },
  ],
};

