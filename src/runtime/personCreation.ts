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
  // 查重命中已有人物后草稿就没用了，清掉以免下次打开 person/new 时误填
  discardPersonDraft(): Promise<void>;
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
  let result: SearchResult | undefined;
  try {
    const candidates = await searchPersonCandidates(name);
    // 与条目一致：filterResults 用姓名直接建正则，特殊字符会抛错，也算搜索失败
    result = filterResults(candidates, { name }, {
      keys: ['name', 'greyName'],
    });
    await runtime.notify({ type: 'info', message: '', cmd: 'dismissNotError' });
  } catch (error) {
    console.error('person search failed:', error);
    await runtime.notify({
      type: 'error',
      message: `Bangumi 人物搜索失败: <br/><b>${name}</b>`,
      cmd: 'dismissNotError',
    });
    throw error;
  }
  console.info('person search result: ', result);
  if (result?.url) {
    await runtime.discardPersonDraft();
    await runtime.openExistingPerson(result.url);
    return;
  }
  await runtime.openNewPerson();
}
