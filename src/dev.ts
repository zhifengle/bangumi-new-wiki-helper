import { SingleInfo } from './interface/subject';
import { adultComicModel } from './models/adultcomic';
import { getWikiData } from './sites/common';
import { findElement } from './utils/domUtils';

async function test() {
  // const infoList: (SingleInfo | void)[] = await getWikiData(adultComicModel);
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
