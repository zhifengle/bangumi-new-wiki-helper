// @ts-ignore
import browser from 'webextension-polyfill';
import {$q} from "../utils/domUtils";
import {getQueryBookInfo, getWikiItem, insertControlBtn} from "../sites/common";
import {sleep} from "../utils/async/sleep";
import {BookSubject, SingleInfo, SubjectWikiInfo} from "../interface/subject";
import {amazonSubjectModel} from "../models/amazonJpBook";
import {SubjectTypeId} from "../interface/wiki";

export const amazon = {
  init() {
    const $title = $q('#title');
    insertControlBtn($title, async (e, flag) => {
      console.log('init')
      const infoList: (SingleInfo | void)[] = amazonSubjectModel.itemList
        .map(item => getWikiItem(item))
        .filter(i => i)
      console.log('infoList: ', infoList)
      const wikiData: SubjectWikiInfo = {
        type: amazonSubjectModel.type,
        subtype: 0,
        infos: infoList as SingleInfo[]
      }
      await browser.storage.local.set({
        wikiData
      });
      if (flag) {
        await browser.runtime.sendMessage({
          action: 'check_subject_exist',
          payload: {
            subjectInfo: getQueryBookInfo(infoList as SingleInfo[]),
            type: amazonSubjectModel.type
          }
        });
      } else {
        await browser.runtime.sendMessage({
          action: 'create_new_subject',
          payload: {
            type: amazonSubjectModel.type
          }
        });
      }
    });
  }
}
