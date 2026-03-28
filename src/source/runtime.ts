import { SingleInfo, SubjectQueryInfo, SubjectWikiInfo } from '../interface/subject';
import { IMsgPayload } from '../interface/types';
import { SiteConfig } from '../interface/wiki';

export type SubjectCreateInput = {
  siteConfig: SiteConfig;
  wikiData: SubjectWikiInfo;
  queryInfo: SubjectQueryInfo;
  payload: IMsgPayload;
  shouldCheckDup: boolean;
};

export type CharacterCreateInput = {
  siteConfig: SiteConfig;
  charaData: SubjectWikiInfo;
};

export interface SourceRuntimeAdapter {
  fetchHtml(url: string): Promise<string>;
  hydrateSubjectCover?(infoList: SingleInfo[]): Promise<void>;
  hydrateCharacterCover?(infoList: SingleInfo[]): Promise<void>;
  submitSubjectCreation(input: SubjectCreateInput): Promise<void>;
  submitCharacterCreation(input: CharacterCreateInput): Promise<void>;
}
