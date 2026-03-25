import { AuxSitePayload } from '../interface/types';
import { SubjectTypeId } from '../interface/wiki';
import {
  CharacterCreateInput,
  SourceRuntimeAdapter,
  SubjectCreateInput,
} from '../source/runtime';
import { updateSubjectDraftFromAuxSite } from '../runtime/auxData';
import {
  checkSubjectAndOpenEntry,
  createNewSubjectEntry,
  SubjectCreationRuntime,
} from '../runtime/subjectCreation';
import { sleep } from '../utils/async/sleep';
import { fetchText } from '../utils/fetchData';
import { logMessage } from '../utils/log';
import { userScriptDraftStore } from './draftStore';
import {
  AUTO_FILL_FORM,
  BGM_DOMAIN,
  PROTOCOL,
} from './constants';

function getBangumiHost() {
  const protocol = GM_getValue(PROTOCOL) || 'https';
  const bgmDomain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
  return `${protocol}://${bgmDomain}`;
}

async function updateAuxData(payload: AuxSitePayload) {
  await updateSubjectDraftFromAuxSite(payload, {
    draftStore: userScriptDraftStore,
    notify: logMessage,
  });
}

async function openNewSubject(type: SubjectTypeId, delay = 200) {
  GM_setValue(AUTO_FILL_FORM, 1);
  setTimeout(() => {
    GM_openInTab(`${getBangumiHost()}/new_subject/${type}`);
  }, delay);
}

async function submitSubjectCreation({
  wikiData,
  queryInfo,
  payload,
  shouldCheckDup,
}: SubjectCreateInput) {
  const bgmHost = getBangumiHost();
  const subjectCreationRuntime = createUserScriptSubjectCreationRuntime(bgmHost);
  await userScriptDraftStore.saveSubjectDraft(wikiData);
  if (shouldCheckDup) {
    await checkSubjectAndOpenEntry(
      {
        subjectInfo: queryInfo,
        type: wikiData.type,
        disableDate: payload?.disableDate,
        auxSite: payload?.auxSite,
      },
      subjectCreationRuntime
    );
    return;
  }
  await createNewSubjectEntry(
    {
      type: wikiData.type,
      auxSite: payload?.auxSite,
    },
    subjectCreationRuntime
  );
}

async function submitCharacterCreation({
  charaData,
}: CharacterCreateInput) {
  GM_setValue(AUTO_FILL_FORM, 1);
  await userScriptDraftStore.saveCharacterDraft(charaData);
  await sleep(200);
  GM_openInTab(`${getBangumiHost()}/character/new`);
}

function createUserScriptSubjectCreationRuntime(
  bgmHost: string
): SubjectCreationRuntime {
  return {
    bgmHost,
    notify: logMessage,
    updateAuxData,
    saveSubjectId(subjectId) {
      return userScriptDraftStore.saveSubjectId(subjectId);
    },
    async openExistingSubject(url: string) {
      await sleep(100);
      GM_openInTab(bgmHost + url);
    },
    openNewSubject,
  };
}

export const userScriptRuntimeAdapter: SourceRuntimeAdapter = {
  fetchHtml(url: string) {
    return fetchText(url);
  },
  submitSubjectCreation,
  submitCharacterCreation,
};
