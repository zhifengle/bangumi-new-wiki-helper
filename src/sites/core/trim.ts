export function trimParenthesis(str: string) {
  const textList = ['\\([^\\d]*?\\)', '（[^\\d]*?）']; // 去掉多余的括号信息
  return str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
}
