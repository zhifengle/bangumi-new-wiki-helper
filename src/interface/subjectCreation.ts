import { SubjectQueryInfo } from './subject';
import { AuxSitePayload } from './types';
import { SubjectTypeId } from './wiki';

export type CreateSubjectEntryPayload = {
  type: SubjectTypeId;
  auxSite?: AuxSitePayload;
};

export type CheckSubjectAndOpenPayload = CreateSubjectEntryPayload & {
  subjectInfo?: SubjectQueryInfo;
  disableDate?: boolean;
};
