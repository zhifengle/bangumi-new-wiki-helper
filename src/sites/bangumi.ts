import {SubjectInfo, SubjectWikiInfo} from '../interface/subject'
import {sleep} from "../utils/async/sleep";
import {$q, $qa} from "../utils/domUtils";

/**
 * 转换 wiki 模式下 infobox 内容
 * @param originValue
 * @param infoArr
 */
export function convertInfoValue(originValue: string, infoArr: SubjectInfo[]) {
  const arr = originValue.trim().split('\n').filter(v => !!v);
  const newArr = [];
  for (const info of infoArr) {
    let isDefault = false;
    for (let i = 0, len = arr.length; i < len; i++) {
      //  |发行日期=  ---> 发行日期
      let n = arr[i].replace(/\||=.*/g, '');
      if (n === info.name) {
        let d = info.value;
        // 拼接： |发行日期=2020-01-01
        arr[i] = arr[i].replace(/=[^{[]+/, '=') + d;
        isDefault = true;
        break;
      }
    }
    if (!isDefault && info.name) {
      newArr.push(`|${info.name}=${info.value}`);
    }
  }
  arr.pop();
  return [...arr, ...newArr, '}}'].join('\n')
}

function observerNode($node: HTMLElement): Promise<any> {
  return new Promise<any>(resolve => {
    const config = { attributes: true, childList: true, subtree: true };
    const observer = new MutationObserver((mutationsList) => {
      observer.disconnect()
      resolve(mutationsList)
    });
    observer.observe($node, config);
  })
}

/**
 * 填写 wiki 表单
 * TODO: 使用 MutationObserver 实现
 * @param wikiData
 */
export async function fillInfoBox(wikiData: SubjectWikiInfo) {
  const {infos} = wikiData;
  const subType = +wikiData.subtype
  const infoArray: SubjectInfo[] = [];
  const $typeInput: NodeList = $qa('table tr:nth-of-type(2) > td:nth-of-type(2) input');
  if ($typeInput) {
    // @ts-ignore
    $typeInput[0].click();
    if (!isNaN(subType)) {
      // @ts-ignore
      $typeInput[subType].click();
    }
  }
  await sleep(100);

  const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]');
  const $newbieMode = $q('table small a:nth-of-type(2)[href="javascript:void(0)"]');
  for (let i = 0, len = infos.length; i < len; i++) {
    if (infos[i].category === 'subject_title') {
      let $title = $q('input[name=subject_title]') as HTMLInputElement;
      $title.value = infos[i].value;
      continue;
    }
    if (infos[i].category === 'subject_summary') {
      let $summary = $q('#subject_summary') as HTMLInputElement;
      $summary.value = infos[i].value;
      continue;
    }
    // 有名称并且category不在制定列表里面
    if (infos[i].name && ['cover'].indexOf(infos[i].category) === -1) {
      infoArray.push(infos[i]);
    }
  }
  $wikiMode.click();
  await sleep(100)
  const $infoBox = $q('#subject_infobox') as HTMLTextAreaElement
  $infoBox.value = convertInfoValue($infoBox.value, infoArray);
  await sleep(200);
  $newbieMode.click();
}
