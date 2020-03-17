export function genRandomStr(len: number): string {
  return Array.apply(null, Array(len)).map(function () {
    return (function (chars) {
      return chars.charAt(Math.floor(Math.random() * chars.length))
    })('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')
  }).join('')
}

export function randomNum(max: number, min: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function dealDate(dataStr: string): string {
  // 2019年12月19
  let l: string[] = [];
  if (/\d{4}年\d{1,2}月(\d{1,2}日?)?/.test(dataStr)) {
    l = dataStr.replace('日', '').split(/年|月/).filter(i => i);
  } else if (/\d{4}\/\d{1,2}(\/\d{1,2})?/.test(dataStr)) {
    l = dataStr.split('/');
  } else if (/\d{4}-\d{1,2}(-\d{1,2})?/.test(dataStr)) {
    return dataStr
  } else {
    throw new Error('invalid date str')
  }
  return l.map((i) => {
    if (i.length === 1) {
      return `0${i}`;
    }
    return i;
  }).join('-');
}

export function isEqualDate(d1: string, d2: string): boolean {
  const resultDate = new Date(d1)
  const originDate = new Date(d2)
  if (resultDate.getFullYear() === originDate.getFullYear() &&
    resultDate.getMonth() === originDate.getMonth() &&
    resultDate.getDate() === originDate.getDate()
  ) {
    return true;
  }
  return false;
}
