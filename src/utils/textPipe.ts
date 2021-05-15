export interface ITextPipe {
  rawInfo: string;
  out?: string;
}

export type IFuncPipe = (pipe: ITextPipe, ...args: any) => ITextPipe;
export type IPipe = 't' | 'ta' | 'k' | 'p' | 'pn' | 'num';
export type IPipeArr = (IPipe | IFuncPipe)[];

export const pipeFnDict: {
  [key in IPipe]: IFuncPipe;
} = {
  // t: 去除开头和结尾的空格
  t: trimSpace,
  // ta: 去除所有空格
  ta: trimAllSpace,
  // k: 去除关键字;
  k: trimKeywords,
  // p: 括号
  p: trimParenthesis,
  // pn: 括号不含数字
  pn: trimParenthesisN,
  // num: 提取数字
  num: getNum,
};

export function getStr(pipe: ITextPipe): string {
  return (pipe.out || pipe.rawInfo).trim();
}

export function trim(pipe: ITextPipe, textList: string[]): ITextPipe {
  let str = getStr(pipe);
  return {
    ...pipe,
    out: str.replace(new RegExp(textList.join('|'), 'g'), ''),
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
  const textList = ['\\(.*?\\)', '（.*?）'];
  // const textList = ['\\([^d]*?\\)', '（[^d]*?）']; // 去掉多余的括号信息
  return trim(pipe, textList);
}

// 保留括号里面的数字. 比如一些图书的 1 2 3
function trimParenthesisN(pipe: ITextPipe): ITextPipe {
  // const textList = ['\\(.*?\\)', '（.*?）'];
  const textList = ['\\([^d]*?\\)', '（[^d]*?）']; // 去掉多余的括号信息
  return trim(pipe, textList);
}
export function trimKeywords(pipe: ITextPipe, keyWords: string[]): ITextPipe {
  return trim(
    pipe,
    keyWords.map((k) => `${k}\s*?(:|：)?`)
  );
}

export function getNum(pipe: ITextPipe): ITextPipe {
  let str = getStr(pipe);
  const m = str.match(/\d+/);
  return {
    rawInfo: pipe.rawInfo,
    out: m ? m[0] : '',
  };
}

/**
 *
 * @param str 原字符串
 * @param pipes 管道
 * @returns 处理后的字符串
 */
export function dealTextByPipe(str: string, pipes: IPipeArr): string {
  let current: ITextPipe = { rawInfo: str };
  pipes = pipes || [];
  for (const p of pipes) {
    if (p instanceof Function) {
      // @TODO 支持传递参数
      current = p(current);
    } else {
      current = pipeFnDict[p](current);
    }
  }
  return current.out || str;
}
