import { BangumiPageState } from '../interface/pageState';

export interface BangumiPageRuntimeAdapter {
  loadPageState(): Promise<BangumiPageState>;
  clearInfo(): Promise<void> | void;
  markAutoFillConsumed?(): Promise<void> | void;
}
