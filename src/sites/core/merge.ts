import { getStringValue, SingleInfo } from '../../interface/subjectInfo';
import { IAuxPrefs } from '../../interface/types';

function isChineseStr(str: string) {
  return /^[\u4e00-\u9fa5]+/i.test(str) && !hasJpStr(str);
}
function hasJpStr(str: string) {
  var pHiragana = /[\u3040-\u309Fー]/;
  var pKatakana = /[\u30A0-\u30FF]/;
  return pHiragana.test(str) || pKatakana.test(str);
}
function getTargetStr(
  str1: string,
  str2: string,
  checkFunc: (str: string) => boolean
): string {
  if (checkFunc(str1)) return str1;
  if (checkFunc(str2)) return str2;
  return '';
}
// 综合两个单项信息
function combineObj(
  current: SingleInfo,
  target: SingleInfo,
  auxPrefs: IAuxPrefs = {}
): SingleInfo[] {
  if (
    auxPrefs.originNames === 'all' ||
    (auxPrefs.originNames && auxPrefs.originNames.includes(current.name))
  ) {
    return [{ ...current }];
  } else if (
    auxPrefs.targetNames === 'all' ||
    (auxPrefs.targetNames && auxPrefs.targetNames.includes(target.name))
  ) {
    return [{ ...target }];
  }
  const obj = { ...current, ...target };
  const currentValue = getStringValue(current.value);
  const targetValue = getStringValue(target.value);
  if (current.category === 'subject_title') {
    // 中日  日英  中英
    let cnName = { name: '中文名', value: '' };
    let titleObj = { ...current };
    let otherName = { name: '别名', value: '', category: 'alias' };
    let chineseStr = getTargetStr(currentValue, targetValue, isChineseStr);
    let jpStr = getTargetStr(currentValue, targetValue, hasJpStr);
    // TODO 状态机？
    if (chineseStr) {
      cnName.value = chineseStr;
      if (currentValue === chineseStr) {
        titleObj.value = targetValue;
      } else {
        titleObj.value = currentValue;
      }
    }
    if (jpStr) {
      titleObj.value = jpStr;
      if (!chineseStr) {
        if (currentValue === jpStr) {
          otherName.value = targetValue;
        } else {
          otherName.value = currentValue;
        }
      }
    }
    return [titleObj, cnName, otherName];
  }
  if (['游戏简介', '开发', '发行'].includes(current.name)) {
    return [{ ...current }];
  }
  if (currentValue.length < targetValue.length) {
    obj.value = targetValue;
  } else {
    obj.value = currentValue;
  }
  return [obj];
}

/**
 * 结合不用网站的信息
 * @param infoList 当前的条目信息
 * @param otherInfoList 参考的条目信息
 */
export function combineInfoList(
  infoList: SingleInfo[],
  otherInfoList: SingleInfo[],
  auxPrefs: IAuxPrefs = {}
): SingleInfo[] {
  // 合并数组为空时
  if (!otherInfoList || !otherInfoList.length) {
    return infoList;
  }
  if (!infoList || !infoList.length) {
    return otherInfoList;
  }
  const multipleNames: string[] = ['平台', '别名'];
  const { targetNames = [], originNames = [] } = auxPrefs;
  const res: SingleInfo[] = [];
  const idxSetOther = new Set();
  for (let i = 0; i < infoList.length; i++) {
    const current = infoList[i];
    const targetFirst: boolean = targetNames.includes(current.name);
    if (targetFirst) {
      continue;
    } else if (!targetFirst && multipleNames.includes(current.name)) {
      res.push(current);
      continue;
    }
    const idxOther = otherInfoList.findIndex(
      (info) => info.name === current.name
    );
    if (idxOther === -1) {
      res.push(current);
    } else {
      const objArr = combineObj(current, otherInfoList[idxOther], auxPrefs);
      res.push(...objArr);
      idxSetOther.add(idxOther);
    }
  }
  for (let j = 0; j < otherInfoList.length; j++) {
    const other = otherInfoList[j];
    const originFirst: boolean = originNames.includes(other.name);
    if (originFirst) {
      continue;
    } else if (!originFirst && multipleNames.includes(other.name)) {
      res.push(other);
      continue;
    }
    if (idxSetOther.has(j)) continue;
    res.push(other);
  }
  const noEmptyArr = res.filter((v) => v.value);
  // ref: https://stackoverflow.com/questions/2218999/remove-duplicates-from-an-array-of-objects-in-javascript
  return noEmptyArr
    .filter(
      (v, i, a) =>
        a.findIndex((t) => t.value === v.value && t.name === v.name) === i
    )
    .filter((v, i, a) => {
      if (v.name !== '别名') return true;
      else {
        return a.findIndex((t) => t.value === v.value) === i;
      }
    });
}

