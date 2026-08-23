import { RuntimeNotifyPayload } from './capabilities';
import { SearchResult } from '../interface/subjectInfo';
import {
  CheckSubjectAndOpenPayload,
  CreateSubjectEntryPayload,
} from '../interface/subjectCreation';
import { SubjectTypeId } from '../interface/wiki';
import { checkSubjectExit } from '../sites/bangumi';
import { getSubjectId } from '../sites/bangumi/common';

export type BangumiRuntimeConfig = {
  host: string;
  fallbackToWebSearch: boolean;
};

export interface SubjectCreationRuntime {
  bangumi: BangumiRuntimeConfig;
  notify(message: RuntimeNotifyPayload): void | Promise<void>;
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

// 搜索 Bangumi 是否已有匹配条目
// - 无结果：返回 undefined，调用方降级新建
// - 网络失败：抛出异常，调用方不应继续新建
async function searchExistingSubject(
  payload: CheckSubjectAndOpenPayload,
  runtime: SubjectCreationRuntime
): Promise<SearchResult | undefined> {
  await runtime.notify({
    type: 'info',
    message: `搜索中...<br/>${payload.subjectInfo?.name ?? ''}`,
    duration: 0,
  });
  try {
    const result = await checkSubjectExit(payload.subjectInfo!, {
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
      message: isUnauthenticatedSearch
        ? `Bangumi 搜索请求丢失了登录状态。<br/>请打开 <a href="${runtime.bangumi.host}/" target="_blank" rel="noopener noreferrer">${runtime.bangumi.host} 主页</a>恢复登录状态，然后返回当前页面重试。`
        : isInvalidSearchPage
          ? `Bangumi 返回了异常的搜索页面，可能是登录状态或搜索频率限制。<br/>请打开 <a href="${runtime.bangumi.host}/" target="_blank" rel="noopener noreferrer">${runtime.bangumi.host} 主页</a>确认登录，并等待至少 60 秒后再试。`
          : `Bangumi 搜索请求失败: <br/><b>${payload.subjectInfo?.name ?? ''}</b>`,
      cmd: 'dismissNotError',
    });
    throw error;
  }
}

export async function checkSubjectAndOpenEntry(
  payload: CheckSubjectAndOpenPayload,
  runtime: SubjectCreationRuntime
) {
  if (!payload.subjectInfo?.name) {
    // 没有名称，无法搜索，直接新建
    await createNewSubjectEntry(
      { type: payload.type, auxSite: payload.auxSite },
      runtime
    );
    return;
  }

  const result = await searchExistingSubject(payload, runtime);

  if (result?.url) {
    await runtime.saveSubjectId(getSubjectId(result.url));
    await runtime.openExistingSubject(result.url);
    return;
  }

  // 搜索无结果，降级新建
  await createNewSubjectEntry(
    { type: payload.type, auxSite: payload.auxSite },
    runtime
  );
}
