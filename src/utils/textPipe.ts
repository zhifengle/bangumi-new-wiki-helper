import { dealDate } from './utils';
import type { TextPattern } from '../interface/textPattern';
import {
  getTextPatternSource,
  isTextPattern,
  replaceTextPatterns,
} from './textPattern';

export interface ITextPipe {
  rawInfo: string;
  out?: string;
}

export type IPipe =
  | 't'
  | 'ta'
  | 'ti'
  | 'k'
  | 'p'
  | 'pn'
  | 'num'
  | 'date'
  | 'label';
export type IPipeArgsDict = Partial<Record<IPipe, unknown[]>>;
export type IFuncPipe = (pipe: ITextPipe, ...args: unknown[]) => ITextPipe;
export type IPipeArr = (IPipe | IFuncPipe)[];

export const pipeFnDict: {
  [key in IPipe]: IFuncPipe;
} = {
  // t: 去除开头和结尾的空格
  t: trimSpace,
  // ta: 去除所有空格
  ta: trimAllSpace,
  // ti: 去除空格，在 getWikiItem 里面，使用 innerText 取文本
  ti: trimSpace,
  // k: 去除关键字;
  k: (pipe, keyWords = []) =>
    trimKeywords(
      pipe,
      Array.isArray(keyWords) ? keyWords.filter(isTextPattern) : []
    ),
  // p: 括号
  p: trimParenthesis,
  // pn: 括号不含数字
  pn: trimParenthesisN,
  // num: 提取数字
  num: getNum,
  date: getDate,
  // label: 去掉前缀标签，例如 “作者:”
  label: trimLeadingLabel,
};

export function getStr(pipe: ITextPipe): string {
  return (pipe.out ?? pipe.rawInfo).trim();
}

export function trim(pipe: ITextPipe, patterns: TextPattern[]): ITextPipe {
  let str = getStr(pipe);
  if (!patterns.length) {
    return {
      ...pipe,
      out: str,
    };
  }
  return {
    ...pipe,
    out: replaceTextPatterns(str, patterns),
  };
}

function trimAllSpace(pipe: ITextPipe): ITextPipe {
  let str = getStr(pipe);
  return {
    ...pipe,
    out: str.replace(/\s/g, ''),
  };
}
function trimSpace(pipe: ITextPipe): ITextPipe {
  let str = getStr(pipe);
  return {
    ...pipe,
    out: str.trim(),
  };
}

function trimParenthesis(pipe: ITextPipe): ITextPipe {
  return trim(pipe, [/\(.*?\)/, /（.*?）/]);
}

// 保留括号里面的数字. 比如一些图书的 1 2 3
function trimParenthesisN(pipe: ITextPipe): ITextPipe {
  return trim(pipe, [/\([^\d]*?\)/, /（[^\d]*?）/]);
}

function createKeywordPatterns(keyWords: TextPattern[] = []): RegExp[] {
  return keyWords.map((pattern) => {
    if (pattern instanceof RegExp) {
      const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
      return new RegExp(`${pattern.source}\\s*?(:|：)?`, flags);
    }
    return new RegExp(`${getTextPatternSource(pattern)}\\s*?(:|：)?`, 'g');
  });
}

export function trimKeywords(
  pipe: ITextPipe,
  keyWords: TextPattern[] = []
): ITextPipe {
  return trim(pipe, createKeywordPatterns(keyWords));
}

export function trimLeadingLabel(pipe: ITextPipe): ITextPipe {
  return {
    ...pipe,
    out: getStr(pipe).replace(/[^\d:]+?(:|：)/, '').trim(),
  };
}

export function getNum(pipe: ITextPipe): ITextPipe {
  let str = getStr(pipe);
  const m = str.match(/\d+/);
  return {
    rawInfo: pipe.rawInfo,
    out: m ? m[0] : '',
  };
}
function getDate(pipe: ITextPipe): ITextPipe {
  let dataStr = getStr(pipe);
  return {
    rawInfo: pipe.rawInfo,
    out: dealDate(dataStr),
  };
}

/**
 *
 * @param str 原字符串
 * @param pipes 管道
 * @returns 处理后的字符串
 */
export function dealTextByPipe(
  str: string,
  pipes: IPipeArr,
  argsDict: IPipeArgsDict = {}
): string {
  let current: ITextPipe = { rawInfo: str };
  pipes = pipes || [];
  for (const p of pipes) {
    if (p instanceof Function) {
      // @TODO 支持传递参数
      current = p(current);
    } else {
      if (argsDict[p]) {
        current = pipeFnDict[p](current, ...argsDict[p]);
      } else {
        current = pipeFnDict[p](current);
      }
    }
  }
  return current.out ?? str;
}
