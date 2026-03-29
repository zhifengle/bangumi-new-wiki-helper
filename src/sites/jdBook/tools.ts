import { SubjectTools } from '../catalogTypes';
import { trimParenthesis } from '../core/trim';

export const jdBookTools: SubjectTools = {
  filters: [
    {
      category: 'subject_title',
      dealFunc(str: string) {
        return trimParenthesis(str);
      },
    },
  ],
};

