import browser from 'webextension-polyfill';
import { SubjectWikiInfo } from '../interface/subject';
import { BangumiPageState } from '../page/bangumiRuntime';
import { BrowserStorageState } from './browserConfig';
import { DraftStore } from './draftStore';

export const browserDraftStore: DraftStore = {
  async saveSubjectDraft(wikiData: SubjectWikiInfo) {
    await browser.storage.local.set({
      wikiData,
    });
  },
  async loadSubjectDraft() {
    const state = (await browser.storage.local.get([
      'wikiData',
    ])) as BrowserStorageState;
    return state.wikiData || null;
  },
  async saveCharacterDraft(charaData: SubjectWikiInfo) {
    await browser.storage.local.set({
      charaData,
    });
  },
  async loadCharacterDraft() {
    const state = (await browser.storage.local.get([
      'charaData',
    ])) as BrowserStorageState;
    return state.charaData || null;
  },
  async saveSubjectId(subjectId: string | number) {
    const state = (await browser.storage.local.get([
      'config',
    ])) as BrowserStorageState;
    await browser.storage.local.set({
      config: {
        ...state.config,
        subjectId,
      },
    });
  },
  async loadSubjectId() {
    const state = (await browser.storage.local.get([
      'config',
    ])) as BrowserStorageState;
    return state.config?.subjectId ?? null;
  },
  async loadBangumiPageState(): Promise<BangumiPageState> {
    const state = (await browser.storage.local.get([
      'config',
      'wikiData',
      'charaData',
    ])) as BrowserStorageState;
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
