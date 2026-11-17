import { SingleInfo } from './interface/subjectInfo';
import { adultComicSubject } from './sites/adultcomic/subject';
import { amazonJpBookSubject } from './sites/amazonJpBook/subject';
import { getWikiData } from './sites/core/extract';
import { findElement } from './utils/domUtils';

async function test() {
  // const infoList: (SingleInfo | void)[] = await getWikiData(adultComicSubject);
  // console.info('wiki info list: ', infoList);

  const targetItem = amazonJpBookSubject.itemList.find(o => o.name === '价格');
  if (targetItem) {
    const $el = findElement(targetItem.selector);
    console.info($el);
  }
}
test();



