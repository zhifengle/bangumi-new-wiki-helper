import {initNewSubject, initUploadImg} from "../sites/bangumi/newSubject";
import {$q} from "../utils/domUtils";
import {AUTO_FILL_FORM, WIKI_DATA} from "./constraints";

export const bangumi = {
  async init() {
    const re = new RegExp(['new_subject', 'add_related', 'character\/new', 'upload_img'].join('|'));
    const page = document.location.href.match(re);
    if (!page) return;
    const wikiData = JSON.parse(GM_getValue(WIKI_DATA) || null)
    const autoFill = GM_getValue(AUTO_FILL_FORM)
    switch (page[0]) {
      case 'new_subject':
        if (wikiData) {
          initNewSubject(wikiData)
          setTimeout(() => {
            if (autoFill) {
              // @ts-ignore
              $q('.e-wiki-fill-form').click()
              GM_setValue(AUTO_FILL_FORM, 0)
            }
          }, 200)
        }
        break
      case 'add_related':
        // this.addRelated();
        break;
      case 'character\/new':
        // this.newCharacter();
        break;
      case 'upload_img':
        if (wikiData) {
          initUploadImg(wikiData)
        }
        break;
    }
  }
}
