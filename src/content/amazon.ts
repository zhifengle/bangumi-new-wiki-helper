import {$q} from "../utils/domUtils";
import {insertControlBtn} from "../sites/common";
import {sleep} from "../utils/async/sleep";

export const amazon = {
  init() {
    const $title = $q('#title');
    insertControlBtn($title, async (e, flag) => {
      await sleep(100)
      console.log('sleep 100', flag)
    });
  }
}
