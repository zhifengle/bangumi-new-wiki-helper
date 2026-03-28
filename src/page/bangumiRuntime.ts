import { SubjectWikiInfo } from '../interface/subjectInfo';

export type BangumiPageState = {
  wikiData?: SubjectWikiInfo | null;
  charaData?: SubjectWikiInfo | null;
  subjectId?: string | number | null;
  shouldAutoFill?: boolean;
  autoFillDelay?: number;
};

export interface BangumiPageRuntimeAdapter {
  loadPageState(): Promise<BangumiPageState>;
  clearInfo(): Promise<void> | void;
  markAutoFillConsumed?(): Promise<void> | void;
}

