import { SingleInfo } from './interface/subjectInfo';
import { adultComicSubject } from './sites/adultcomic/subject';
import { getWikiData } from './sites/core/extract';
import { findElement } from './utils/domUtils';

async function test() {
  // const infoList: (SingleInfo | void)[] = await getWikiData(adultComicSubject);
  // console.info('wiki info list: ', infoList);

  const $el = findElement({
    selector: '#info-table > div.info-box > dl',
    subSelector: 'dt',
    sibling: true,
    keyWord: '漫画家',
  });
  console.info($el);
}
test();



