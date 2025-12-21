import browser from 'webextension-polyfill';

import { $q } from '../utils/domUtils';
import {
  initNewCharacter,
  initNewSubject,
  initUploadImg,
} from '../sites/bangumi/newSubject';

function clearInfo() {
  browser.storage.local.remove(['wikiData', 'charaData']);
}

const bangumi = {
  async init() {
    const re = new RegExp(
      ['new_subject', 'add_related', 'character/new', 'upload_img'].join('|')
    );
    const page = document.location.href.match(re);
    if (!page) return;
    const r: any = await browser.storage.local.get([
      'config',
      'wikiData',
      'charaData',
    ]);
    window.addEventListener('scriptMessage', (e: any) => {
      if (e.detail.type === 'clearInfo') {
        console.info('clear info');
        clearInfo();
      }
    })
    switch (page[0]) {
      case 'new_subject':
        if (r && r.wikiData) {
          initNewSubject(r.wikiData);
          setTimeout(() => {
            if (r.config.autoFill) {
              // @ts-ignore
              $q('.e-wiki-fill-form').click();
            }
          }, 200);
        } else {
          initNewSubject({
            type: +window.location.pathname.split('/')[2] || 1,
            infos: [],
          });
        }
        break;
      case 'add_related':
        // this.addRelated();
        break;
      case 'character/new':
        if (r && r.wikiData) {
          initNewCharacter(r.charaData, r.config.subjectId);
          setTimeout(() => {
            if (r.config.autoFill) {
              // @ts-ignore
              $q('.e-wiki-fill-form').click();
            }
          }, 200);
        }
        break;
      case 'upload_img':
        if (r && r.wikiData) {
          initUploadImg(r.wikiData);
        }
        break;
    }
  },
};

bangumi.init();
