import { getStringValue, SingleInfo } from '../../../interface/subject';
import { dealDate } from '../../../utils/utils';

function hasCategory(info: SingleInfo, category: string) {
  if (info.category === category) {
    return true;
  }
  return (
    info.category &&
    info.category.includes(',') &&
    info.category.split(',').includes(category)
  );
}

/**
 * 转换 wiki 模式下 infobox 内容
 * @param originValue
 * @param infoArr
 */
export function convertInfoValue(
  originValue: string,
  infoArr: SingleInfo[]
): string {
  let arr = originValue
    .trim()
    .split('\n')
    .filter((v) => !!v);
  // 处理多个.
  const categories = ['website'];
  for (const cat of categories) {
    const infos = infoArr.filter((i) => i.name === cat);
    if (infos.length > 1) {
      const idx = arr.findIndex((v) => v.trim() === `|${cat}=`);
      if (arr.find((v) => v.trim() === `|${cat}={`)) {
        continue;
      }
      if (idx > -1) {
        arr[idx] = `|${cat}={`;
        // arr.splice(idx + 1, 0, '}')
        arr = [...arr.slice(0, idx + 1), '}', ...arr.slice(idx + 1)];
      } else {
        arr = [...arr.slice(0, -1), `|${cat}={`, '}', ...arr.slice(-1)];
      }
    }
  }
  //处理单个但是写成多个.写法有点绕，凑合用吧
  for (const info of infoArr) {
    if (hasCategory(info, 'listItem')) {
      const name = info.name;
      if (arr.find((v) => v.trim() === `|${name}={`)) {
        continue;
      }
      const idx = arr.findIndex((v) => v.trim() === `|${name}=`);
      if (idx > -1) {
        arr[idx] = `|${name}={`;
        arr = [...arr.slice(0, idx + 1), '}', ...arr.slice(idx + 1)];
      } else {
        arr = [...arr.slice(0, -1), `|${name}={`, '}', ...arr.slice(-1)];
      }
    }
  }
  const newArr = [];
  for (const info of infoArr) {
    let isDefault = false;
    for (let i = 0, len = arr.length; i < len; i++) {
      //  |发行日期=  ---> 发行日期
      // [纯假名|] ---> 纯假名
      const m = arr[i].match(/(?:\||\[)(.+?)([|=])/);
      if (!m || m.length < 2) continue;
      const n = m[1];
      if (n === info.name) {
        let d = getStringValue(info.value);
        // 处理时间格式
        if (info.category === 'date') {
          d = dealDate(d);
        }
        // 2024-07-31 去除 ISBN 里面的短横线
        if (info.category === 'ISBN') {
          d = d.replace(/-/g, '');
        }
        // 匹配到 [英文名|]
        if (/\[.+\|\]/.test(arr[i])) {
          arr[i] = arr[i].replace(']', '') + d + ']';
        } else if (/\|.+={/.test(arr[i])) {
          // 避免重复
          const infoValue = getStringValue(info.value);
          if (!originValue.includes(`[${infoValue}]`)) {
            // |平台={
            arr[i] = `${arr[i]}\n[${infoValue}]`;
          }
        } else {
          // 拼接： |发行日期=2020-01-01
          arr[i] = arr[i].replace(/=[^{[]+/, '=') + d;
        }
        isDefault = true;
        break;
      }
    }
    // 抹去 asin 2020/7/26
    if (!isDefault && info.name && !['asin', 'ASIN'].includes(info.name)) {
      newArr.push(`|${info.name}=${getStringValue(info.value)}`);
    }
  }
  arr.pop();
  // 图书条目的 infobox 作者放在出版社之前
  if (/animanga/.test(arr[0])) {
    let pressIdx;
    let authorIdx;
    let resArr = [...arr, ...newArr, '}}'];
    for (let i = 0; i < resArr.length; i++) {
      if (/\|(\s*)出版社(\s*)=/.test(resArr[i])) {
        pressIdx = i;
        continue;
      }
      if (/作者/.test(resArr[i])) {
        authorIdx = i;
        continue;
      }
    }
    if (pressIdx && authorIdx && authorIdx > pressIdx) {
      const press = resArr[pressIdx];
      const author = resArr[authorIdx];
      resArr.splice(pressIdx, 1, author, press);
      resArr.splice(authorIdx + 1, 1);
      return resArr.join('\n');
    }
  }
  return [...arr, ...newArr, '}}'].join('\n');
}
