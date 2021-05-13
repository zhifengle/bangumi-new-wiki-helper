import { dlsiteGameModel } from './models/dlsiteGame';
import { dmmGameModel } from './models/dmmGame';
import { getWikiData } from './sites/common';
import { findElement } from './utils/domUtils';

async function test() {
  const d = await getWikiData(dmmGameModel);
  console.log(d);
  // debugger;
  // const p = findElement(dlsiteGameModel.pageSelectors);
  // console.log(p);
}
test();
