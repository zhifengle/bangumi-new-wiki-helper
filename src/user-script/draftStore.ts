import { PersonWikiInfo, SubjectWikiInfo } from '../interface/subjectInfo';
import { BangumiPageState } from '../interface/pageState';
import { DraftStore } from '../runtime/draftStore';
import {
  AUTO_FILL_FORM,
  CHARA_DATA,
  PERSON_DATA,
  SUBJECT_ID,
  WIKI_DATA,
} from './constants';

export const userScriptDraftStore: DraftStore = {
  async saveSubjectDraft(wikiData: SubjectWikiInfo) {
    GM_setValue(WIKI_DATA, JSON.stringify(wikiData));
  },
  async loadSubjectDraft() {
    return JSON.parse(GM_getValue<string>(WIKI_DATA) || 'null');
  },
  async saveCharacterDraft(charaData: SubjectWikiInfo) {
    GM_setValue(CHARA_DATA, JSON.stringify(charaData));
  },
  async loadCharacterDraft() {
    return JSON.parse(GM_getValue<string>(CHARA_DATA) || 'null');
  },
  async savePersonDraft(personData: PersonWikiInfo) {
    GM_setValue(PERSON_DATA, JSON.stringify(personData));
  },
  async loadPersonDraft() {
    return JSON.parse(GM_getValue<string>(PERSON_DATA) || 'null');
  },
  async clearPersonDraft() {
    GM_deleteValue(PERSON_DATA);
  },
  async saveSubjectId(subjectId: string | number) {
    GM_setValue(SUBJECT_ID, subjectId);
  },
  async loadSubjectId() {
    return GM_getValue<string | number>(SUBJECT_ID);
  },
  async loadBangumiPageState(): Promise<BangumiPageState> {
    return {
      wikiData: JSON.parse(GM_getValue<string>(WIKI_DATA) || 'null'),
      charaData: JSON.parse(GM_getValue<string>(CHARA_DATA) || 'null'),
      personData: JSON.parse(GM_getValue<string>(PERSON_DATA) || 'null'),
      subjectId: GM_getValue<string | number>(SUBJECT_ID),
      shouldAutoFill: GM_getValue<number>(AUTO_FILL_FORM) == 1,
      autoFillDelay: 300,
    };
  },
  async clearBangumiPageState() {
    GM_deleteValue(AUTO_FILL_FORM);
    GM_deleteValue(WIKI_DATA);
    GM_deleteValue(CHARA_DATA);
    GM_deleteValue(PERSON_DATA);
    GM_deleteValue(SUBJECT_ID);
  },
  async consumeAutoFill() {
    GM_setValue(AUTO_FILL_FORM, 0);
  },
};

