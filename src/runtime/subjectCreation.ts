import { RuntimeNotifyPayload } from './capabilities';
import { SearchResult } from '../interface/subjectInfo';
import {
  CheckSubjectAndOpenPayload,
  CreateSubjectEntryPayload,
} from '../interface/subjectCreation';
import { SubjectTypeId } from '../interface/wiki';
import { checkSubjectExit } from '../sites/bangumi';
import { getSubjectId } from '../sites/bangumi/common';

export interface SubjectCreationRuntime {
  bgmHost: string;
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

export async function checkSubjectAndOpenEntry(
  payload: CheckSubjectAndOpenPayload,
  runtime: SubjectCreationRuntime
) {
  if (!payload.subjectInfo) {
    await createNewSubjectEntry(
      {
        type: payload.type,
        auxSite: payload.auxSite,
      },
      runtime
    );
    return;
  }
  await runtime.notify({
    type: 'info',
    message: `搜索中...<br/>${payload.subjectInfo?.name ?? ''}`,
    duration: 0,
  });
  let result: SearchResult | undefined = undefined;
  try {
    result = await checkSubjectExit(
      payload.subjectInfo,
      runtime.bgmHost,
      payload.type,
      payload.disableDate
    );
    console.info('search results: ', result);
    await runtime.notify({
      type: 'info',
      message: '',
      cmd: 'dismissNotError',
    });
  } catch (error) {
    console.log('fetch info err:', error, error?.message);
    await runtime.notify({
      type: 'error',
      message: `Bangumi 搜索匹配结果为空: <br/><b>${
        payload.subjectInfo?.name ?? ''
      }</b>`,
      cmd: 'dismissNotError',
    });
  }
  if (result && result.url) {
    await runtime.saveSubjectId(getSubjectId(result.url));
    await runtime.openExistingSubject(result.url);
    return;
  }
  await createNewSubjectEntry(
    {
      type: payload.type,
      auxSite: payload.auxSite,
    },
    runtime
  );
}

