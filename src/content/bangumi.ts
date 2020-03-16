// @ts-ignore
import browser from 'webextension-polyfill';
import {$q, $qa} from "../utils/domUtils";
import {book as book2} from "../data/subject";
import {SubjectWikiInfo} from "../interface/subject";
import {initNewSubject} from "../sites/bangumi/newSubject";


const bangumi = {
  async init() {
    const re = new RegExp(['new_subject', 'add_related', 'character\/new', 'upload_img'].join('|'));
    const page = document.location.href.match(re);
    if (!page) return;
    switch (page[0]) {
      case 'new_subject':
        const r = await browser.storage.local.get(['config', 'wikiData'])
        if (r && r.wikiData) {
          initNewSubject(r.wikiData)
          setTimeout(() => {
            console.log('auto click')
            // @ts-ignore
            $q('.e-wiki-fill-form').click()
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
        break;
    }
  }
}

bangumi.init()
