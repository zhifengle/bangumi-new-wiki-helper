import {InfoConfig, Selector} from "../interface/wiki";
import {findElement, getText} from "../utils/domUtils";
import {BookSubject, SingleInfo, Subject} from "../interface/subject";

export function dealText(
  str: string,
  category: string,
  filterArray?: string[]): string {
  const separators = [':', '：', ',', '，']
  if (category === 'subject_summary') {
    return str;
  }
  if (category === 'subject_title') {
    return str.replace(/(?:(\d+))(\)|）).*$/, '$1$2');
  }
  const textList = ['\\(.*\\)', '（.*）', ...filterArray];
  return str.replace(new RegExp(textList.join('|'), 'g'), '')
    .trim().replace(new RegExp(separators.join('|')), '');
}

export function getWikiItem(infoConfig: InfoConfig): SingleInfo | void {
  const $d = findElement(infoConfig.selector)
  const val = dealText(getText($d as HTMLElement), infoConfig.category)
  if (val) {
    return {
      name: infoConfig.name,
      value: val,
      category: infoConfig.category
    } as SingleInfo
  }
}

export function getQueryInfo(items: SingleInfo[]) : Subject {
  let info = {} as Subject;
  items.forEach((item) => {
    if (item.category === 'subject_title') {
      info.name = item.value;
    }
    if (item.category === 'date') {
      info.releaseDate = item.value;
    }
  });
  return info;
}

export function getQueryBookInfo(items: SingleInfo[]): BookSubject {
  let info = {} as BookSubject;
  items.forEach((item) => {
    if (item.category === 'subject_title') {
      info.name = item.value;
    }
    if (item.category === 'date') {
      info.releaseDate = item.value;
    }
    if (item.category === 'ASIN') {
      info.asin = item.value;
    }
    if (item.category === 'ISBN') {
      info.isbn = item.value;
    }
  });
  return info;
}
