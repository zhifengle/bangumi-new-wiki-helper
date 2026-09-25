import { PersonWikiInfo, SubjectWikiInfo } from './subjectInfo';

export type BangumiPageState = {
  wikiData?: SubjectWikiInfo | null;
  charaData?: SubjectWikiInfo | null;
  personData?: PersonWikiInfo | null;
  subjectId?: string | number | null;
  shouldAutoFill?: boolean;
  autoFillDelay?: number;
};
