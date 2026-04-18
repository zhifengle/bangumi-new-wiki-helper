import { SubjectWikiInfo } from './subjectInfo';

export type BangumiPageState = {
  wikiData?: SubjectWikiInfo | null;
  charaData?: SubjectWikiInfo | null;
  subjectId?: string | number | null;
  shouldAutoFill?: boolean;
  autoFillDelay?: number;
};
