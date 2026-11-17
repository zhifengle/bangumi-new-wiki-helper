import { RuntimeNotifyPayload } from './capabilities';
import {
  CheckSubjectAndOpenPayload,
  CreateSubjectEntryPayload,
  SubjectCandidateChoice,
  SubjectCandidatePrompt,
} from '../interface/subjectCreation';
import { SubjectTypeId } from '../interface/wiki';
import { checkSubjectExit, SubjectDuplicateResult } from '../sites/bangumi';
import { BangumiAccessTokenError } from '../sites/bangumi/authenticatedSearch';
import { getSubjectId } from '../sites/bangumi/common';
import type { DraftStore } from './draftStore';

export type BangumiRuntimeConfig = {
  host: string;
  fallbackToWebSearch: boolean;
  accessToken?: string;
};

export interface SubjectCreationRuntime {
  bangumi: BangumiRuntimeConfig;
  notify(message: RuntimeNotifyPayload): void | Promise<void>;
  chooseSubject?(prompt: SubjectCandidatePrompt): Promise<SubjectCandidateChoice>;
  saveSubjectDraft?: DraftStore['saveSubjectDraft'];
  updateAuxData(
    payload: NonNullable<CreateSubjectEntryPayload['auxSite']>
  ): Promise<void>;
  saveSubjectId(subjectId: string | number): Promise<void>;
  openExistingSubject(url: string): Promise<void>;
  openNewSubject(type: SubjectTypeId): Promise<void>;
}

export async function createNewSubjectEntry(
  payload: CreateSubjectEntryPayload,
  runtime: SubjectCreationRuntime
) {
  if (payload.auxSite) {
    await runtime.updateAuxData(payload.auxSite);
  }
  await runtime.openNewSubject(payload.type);
}

/** 清除当前非错误通知（如 loading 提示） */
function dismissNotification(): RuntimeNotifyPayload {
  return { type: 'info', message: '', cmd: 'dismissNotError' };
}

async function searchExistingSubject(
  payload: CheckSubjectAndOpenPayload,
  runtime: SubjectCreationRuntime
): Promise<SubjectDuplicateResult> {
  const subjectInfo = payload.subjectInfo!;
  await runtime.notify({
    type: 'info',
    message: 'Bangumi 条目搜索中…',
    duration: 0,
  });
  try {
    const result = await checkSubjectExit(payload.disableDate
      ? { ...subjectInfo, releaseDate: undefined }
      : subjectInfo, {
      ...runtime.bangumi,
      type: payload.type,
    });
    console.info('search results: ', result);
    await runtime.notify(dismissNotification());
    return result;
  } catch (error) {
    console.error('search request failed:', error);
    const isUnauthenticatedSearch =
      error instanceof Error &&
      error.name === 'UnauthenticatedBangumiSearchError';
    const isInvalidSearchPage =
      error instanceof Error &&
      error.name === 'InvalidBangumiSearchResponseError';
    await runtime.notify({
      type: 'error',
      message: error instanceof BangumiAccessTokenError
        ? 'Bangumi 拒绝了 Access Token。请在「条目助手设置」中更新或清除 Token 后重试。'
        : isUnauthenticatedSearch
        ? 'Bangumi 搜索请求丢失了登录状态。请在 Bangumi 重新登录，再返回当前页面重试。'
        : isInvalidSearchPage
          ? 'Bangumi 返回了异常的搜索页面。请确认登录状态，并等待至少 60 秒后再试。'
          : 'Bangumi 搜索请求失败，请重试。',
      link: isUnauthenticatedSearch || isInvalidSearchPage ? runtime.bangumi.host : undefined,
      cmd: 'dismissNotError',
    });
    throw error;
  }
}

export async function checkSubjectAndOpenEntry(
  payload: CheckSubjectAndOpenPayload,
  runtime: SubjectCreationRuntime
) {
  const name = payload.subjectInfo?.name?.trim();
  const isbn = payload.type === SubjectTypeId.book && payload.subjectInfo?.isbn?.trim();
  if (!name && !isbn) {
    await runtime.notify({ type: 'error', message: '缺少条目名称或 ISBN，无法查重。' });
    return;
  }

  const result = await searchExistingSubject(payload, runtime);

  if (result && 'url' in result) {
    await runtime.saveSubjectId(getSubjectId(result.url));
    await runtime.openExistingSubject(result.url);
    return;
  }
  if (result && 'candidates' in result) {
    const choice = await runtime.chooseSubject?.({
      name: name || isbn || '',
      candidates: result.candidates,
    });
    if (!choice) return;
    if (choice.kind === 'open') {
      const candidate = result.candidates.find(({ url }) => url === choice.url);
      if (candidate) {
        await runtime.saveSubjectId(getSubjectId(candidate.url));
        await runtime.openExistingSubject(candidate.url);
      }
      return;
    }
    if (choice.kind !== 'create') return;
  }

  if (payload.draft) await runtime.saveSubjectDraft?.(payload.draft);
  await createNewSubjectEntry(
    { type: payload.type, auxSite: payload.auxSite },
    runtime
  );
}
