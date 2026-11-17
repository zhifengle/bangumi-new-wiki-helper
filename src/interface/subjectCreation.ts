import { SearchResult, SubjectQueryInfo, SubjectWikiInfo } from './subjectInfo';
import { AuxSitePayload } from './types';
import { SubjectTypeId } from './wiki';

export type CreateSubjectEntryPayload = {
  type: SubjectTypeId;
  auxSite?: AuxSitePayload;
};

export type CheckSubjectAndOpenPayload = CreateSubjectEntryPayload & {
  subjectInfo?: SubjectQueryInfo;
  disableDate?: boolean;
  draft?: SubjectWikiInfo;
};

export type SubjectCandidatePrompt = {
  name: string;
  candidates: SearchResult[];
};

export type SubjectCandidateChoice =
  | { kind: 'open'; url: string }
  | { kind: 'create' }
  | null;

