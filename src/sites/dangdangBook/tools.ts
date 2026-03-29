import { SubjectTools } from '../catalogTypes';
import { trimParenthesis } from '../core/trim';
import { dealDate } from '../../utils/utils';

export const dangdangBookTools: SubjectTools = {
  filters: [
    {
      category: 'date',
      dealFunc(str: string) {
        return dealDate(str.replace(/出版时间[:：]/, '').trim());
      },
    },
    {
      category: 'subject_title',
      dealFunc(str: string) {
        return trimParenthesis(str);
      },
    },
  ],
};

