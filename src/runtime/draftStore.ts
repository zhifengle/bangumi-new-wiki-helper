import { PersonWikiInfo, SubjectWikiInfo } from '../interface/subjectInfo';
import { BangumiPageState } from '../interface/pageState';

export interface DraftStore {
  saveSubjectDraft(wikiData: SubjectWikiInfo): Promise<void>;
  loadSubjectDraft(): Promise<SubjectWikiInfo | null>;
  saveCharacterDraft(charaData: SubjectWikiInfo): Promise<void>;
  loadCharacterDraft(): Promise<SubjectWikiInfo | null>;
  savePersonDraft(personData: PersonWikiInfo): Promise<void>;
  loadPersonDraft(): Promise<PersonWikiInfo | null>;
  saveSubjectId(subjectId: string | number): Promise<void>;
  loadSubjectId(): Promise<string | number | null>;
  loadBangumiPageState(): Promise<BangumiPageState>;
  clearBangumiPageState(): Promise<void>;
  consumeAutoFill?(): Promise<void>;
}

