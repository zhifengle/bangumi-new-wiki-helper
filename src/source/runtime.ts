import { SingleInfo, SubjectQueryInfo, SubjectWikiInfo } from '../interface/subjectInfo';
import { IMsgPayload } from '../interface/types';
import { SubjectSourceDefinition } from '../interface/wiki';

export type SubjectCreateInput = {
  siteConfig: SubjectSourceDefinition;
  wikiData: SubjectWikiInfo;
  queryInfo: SubjectQueryInfo;
  payload: IMsgPayload;
  shouldCheckDup: boolean;
};

export type CharacterCreateInput = {
  siteConfig: SubjectSourceDefinition;
  charaData: SubjectWikiInfo;
};

export interface SourceRuntimeAdapter {
  fetchHtml(url: string): Promise<string>;
  hydrateSubjectCover?(infoList: SingleInfo[]): Promise<void>;
  hydrateCharacterCover?(infoList: SingleInfo[]): Promise<void>;
  submitSubjectCreation(input: SubjectCreateInput): Promise<void>;
  submitCharacterCreation(input: CharacterCreateInput): Promise<void>;
}


