import { SubjectTools } from '../catalogTypes';
import { trimParenthesis } from '../core/trim';

export function jdTitle(str: string) {
  return trimParenthesis(str);
}

export const jdBookTools: SubjectTools = {};

