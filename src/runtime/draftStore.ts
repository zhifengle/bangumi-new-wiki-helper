import { SubjectWikiInfo } from '../interface/subject';
import { BangumiPageState } from '../page/bangumiRuntime';

export interface DraftStore {
  saveSubjectDraft(wikiData: SubjectWikiInfo): Promise<void>;
  loadSubjectDraft(): Promise<SubjectWikiInfo | null>;
  saveCharacterDraft(charaData: SubjectWikiInfo): Promise<void>;
  loadCharacterDraft(): Promise<SubjectWikiInfo | null>;
  saveSubjectId(subjectId: string | number): Promise<void>;
  loadSubjectId(): Promise<string | number | null>;
  loadBangumiPageState(): Promise<BangumiPageState>;
  clearBangumiPageState(): Promise<void>;
  consumeAutoFill?(): Promise<void>;
}
