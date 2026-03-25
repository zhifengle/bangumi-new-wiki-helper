import browser from 'webextension-polyfill';
import { SubjectWikiInfo } from '../interface/subject';
import { BangumiPageState } from '../page/bangumiRuntime';
import { DraftStore } from './draftStore';

export const browserDraftStore: DraftStore = {
  async saveSubjectDraft(wikiData: SubjectWikiInfo) {
    await browser.storage.local.set({
      wikiData,
    });
  },
  async loadSubjectDraft() {
    const state: any = await browser.storage.local.get(['wikiData']);
    return state.wikiData || null;
  },
  async saveCharacterDraft(charaData: SubjectWikiInfo) {
    await browser.storage.local.set({
      charaData,
    });
  },
  async loadCharacterDraft() {
    const state: any = await browser.storage.local.get(['charaData']);
    return state.charaData || null;
  },
  async saveSubjectId(subjectId: string | number) {
    const state: any = await browser.storage.local.get(['config']);
    await browser.storage.local.set({
      config: {
        ...state.config,
        subjectId,
      },
    });
  },
  async loadSubjectId() {
    const state: any = await browser.storage.local.get(['config']);
    return state.config?.subjectId ?? null;
  },
  async loadBangumiPageState(): Promise<BangumiPageState> {
    const state: any = await browser.storage.local.get([
      'config',
      'wikiData',
      'charaData',
    ]);
    return {
      wikiData: state.wikiData,
      charaData: state.charaData,
      subjectId: state.config?.subjectId,
      shouldAutoFill: !!state.config?.autoFill,
      autoFillDelay: 200,
    };
  },
  async clearBangumiPageState() {
    await browser.storage.local.remove(['wikiData', 'charaData']);
  },
};
