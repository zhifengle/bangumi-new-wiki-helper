import { dlsiteGameModel } from './models/dlsiteGame';
import { dlsiteGameCharaModel } from './models/dlsiteGameChara';
import { dmmGameModel } from './models/dmmGame';
import { getWikiData } from './sites/common';
import { findAllElement, findElement } from './utils/domUtils';

async function test() {
  // let d = await getWikiData(dmmGameModel);
  var d = findAllElement(dlsiteGameCharaModel.controlSelector);
  console.log(d);
  // debugger;
  // const p = findElement(dlsiteGameModel.pageSelectors);
  // console.log(p);
}
test();
