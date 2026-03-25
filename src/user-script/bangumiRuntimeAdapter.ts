import {
  BangumiPageRuntimeAdapter,
} from '../page/bangumiRuntime';
import { userScriptDraftStore } from './draftStore';

export const userScriptBangumiRuntimeAdapter: BangumiPageRuntimeAdapter = {
  loadPageState() {
    return userScriptDraftStore.loadBangumiPageState();
  },
  clearInfo() {
    return userScriptDraftStore.clearBangumiPageState();
  },
  markAutoFillConsumed() {
    return userScriptDraftStore.consumeAutoFill();
  },
};
