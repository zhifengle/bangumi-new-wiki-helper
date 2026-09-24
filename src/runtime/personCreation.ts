import { CheckPersonAndOpenPayload } from '../interface/personCreation';
import { SearchResult } from '../interface/subjectInfo';
import { searchPersonCandidates } from '../sites/bangumi/personSearch';
import { filterResults } from '../sites/core/search';
import { RuntimeNotifyPayload } from './capabilities';

export interface PersonCreationRuntime {
  bangumi: {
    host: string;
  };
  notify(message: RuntimeNotifyPayload): void | Promise<void>;
  openExistingPerson(url: string): Promise<void>;
  openNewPerson(): Promise<void>;
}

// 与条目的 checkSubjectAndOpenEntry 同一套流程：
// 搜到就打开已有人物，搜不到才打开 person/new；候选筛选沿用 filterResults。
export async function checkPersonAndOpenEntry(
  payload: CheckPersonAndOpenPayload,
  runtime: PersonCreationRuntime
) {
  const name = payload.name?.trim() ?? '';
  if (!name) {
    await runtime.openNewPerson();
    return;
  }

  await runtime.notify({
    type: 'info',
    message: `搜索中...<br/>${name}`,
    duration: 0,
  });
  let candidates: SearchResult[];
  try {
    candidates = await searchPersonCandidates(name);
    await runtime.notify({ type: 'info', message: '', cmd: 'dismissNotError' });
  } catch (error) {
    console.error('person search request failed:', error);
    await runtime.notify({
      type: 'error',
      message: `Bangumi 人物搜索请求失败: <br/><b>${name}</b>`,
      cmd: 'dismissNotError',
    });
    throw error;
  }

  const result = filterResults(candidates, { name }, {
    keys: ['name', 'greyName'],
  });
  console.info('person search result: ', result);
  if (result?.url) {
    await runtime.openExistingPerson(result.url);
    return;
  }
  await runtime.openNewPerson();
}
