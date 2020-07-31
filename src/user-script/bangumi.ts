import {
  initNewCharacter,
  initNewSubject,
  initUploadImg,
} from '../sites/bangumi/newSubject';
import { $q } from '../utils/domUtils';
import {
  AUTO_FILL_FORM,
  CHARA_DATA,
  WIKI_DATA,
  SUBJECT_ID,
} from './constraints';

export const bangumi = {
  async init() {
    const re = new RegExp(
      ['new_subject', 'add_related', 'character/new', 'upload_img'].join('|')
    );
    const page = document.location.href.match(re);
    if (!page) return;
    const wikiData = JSON.parse(GM_getValue(WIKI_DATA) || null);
    const charaData = JSON.parse(GM_getValue(CHARA_DATA) || null);
    const subjectId = GM_getValue(SUBJECT_ID);
    const autoFill = GM_getValue(AUTO_FILL_FORM);
    switch (page[0]) {
      case 'new_subject':
        if (wikiData) {
          initNewSubject(wikiData);
          if (autoFill == 1) {
            setTimeout(() => {
              // @ts-ignore
              $q('.e-wiki-fill-form').click();
              GM_setValue(AUTO_FILL_FORM, 0);
            }, 300);
          }
        }
        break;
      case 'add_related':
        break;
      case 'character/new':
        if (charaData) {
          initNewCharacter(charaData, subjectId);
          if (autoFill == 1) {
            setTimeout(() => {
              // @ts-ignore
              $q('.e-wiki-fill-form').click();
              GM_setValue(AUTO_FILL_FORM, 0);
            }, 300);
          }
        }
        break;
      case 'upload_img':
        if (wikiData) {
          initUploadImg(wikiData);
        }
        break;
    }
  },
};
