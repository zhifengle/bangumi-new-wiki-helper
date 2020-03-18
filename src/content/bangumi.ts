// @ts-ignore
import browser from 'webextension-polyfill';
import {$q} from "../utils/domUtils";
import {initNewSubject, initUploadImg} from "../sites/bangumi/newSubject";


const bangumi = {
  async init() {
    const re = new RegExp(['new_subject', 'add_related', 'character\/new', 'upload_img'].join('|'));
    const page = document.location.href.match(re);
    if (!page) return;
    const r = await browser.storage.local.get(['config', 'wikiData'])
    switch (page[0]) {
      case 'new_subject':
        if (r && r.wikiData) {
          initNewSubject(r.wikiData)
          setTimeout(() => {
            if (r.config.autoFill) {
              // @ts-ignore
              $q('.e-wiki-fill-form').click()
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
        if (r && r.wikiData) {
          initUploadImg(r.wikiData)
        }
        break;
    }
  }
}

bangumi.init()
