import { dlsiteGameModel } from './models/dlsiteGame';
import { getWikiData } from './sites/common';
import { findElement } from './utils/domUtils';

async function test() {
  // const d = await getWikiData(dlsiteGameModel);
  // console.log(d);
  debugger;
  const p = findElement(dlsiteGameModel.pageSelectors);
  console.log(p);
}
test();
