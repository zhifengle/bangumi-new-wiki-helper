import {
  BangumiPageRuntimeAdapter,
} from '../page/bangumiRuntime';
import { contentDraftStore } from './draftStore';

export const contentBangumiRuntimeAdapter: BangumiPageRuntimeAdapter = {
  loadPageState() {
    return contentDraftStore.loadBangumiPageState();
  },
  clearInfo() {
    return contentDraftStore.clearBangumiPageState();
  },
};
