import { AuxSitePayload } from '../interface/types';
import { SubjectTypeId } from '../interface/wiki';
import {
  CharacterCreateInput,
  PersonCreateInput,
  SourceRuntimeAdapter,
  SubjectCreateInput,
} from '../source/runtime';
import { updateSubjectDraftFromAuxSite } from '../runtime/auxData';
import {
  checkPersonAndOpenEntry,
  PersonCreationRuntime,
} from '../runtime/personCreation';
import {
  checkSubjectAndOpenEntry,
  createNewSubjectEntry,
  SubjectCreationRuntime,
} from '../runtime/subjectCreation';
import { sleep } from '../utils/async/sleep';
import { logMessage } from '../utils/log';
import { chooseSubjectCandidate } from '../source/subjectCandidates';
import { userScriptRuntimeCapabilities } from './runtimeCapabilities';
import {
  AUTO_FILL_FORM,
  BGM_DOMAIN,
  BGM_ACCESS_TOKEN,
  FALLBACK_TO_PERSON_WORKS,
  PROTOCOL,
  FALLBACK_TO_WEB_SEARCH,
  USE_LEGACY_JSON_SEARCH,
} from './constants';

function getBangumiHost() {
  const protocol = GM_getValue<string>(PROTOCOL) || 'https';
  const bgmDomain = GM_getValue<string>(BGM_DOMAIN) || 'bgm.tv';
  return `${protocol}://${bgmDomain}`;
}

const defaultOpenTab = async (url: string) => {
  GM_openInTab(url);
};

function getOpenTab() {
  return userScriptRuntimeCapabilities.navigator?.openTab ?? defaultOpenTab;
}

async function updateAuxData(payload: AuxSitePayload) {
  await updateSubjectDraftFromAuxSite(payload, {
    storage: userScriptRuntimeCapabilities.storage,
    notifier: {
      notify: userScriptRuntimeCapabilities.notifier?.notify ?? logMessage,
    },
  });
}

async function openNewSubject(type: SubjectTypeId, delay = 200) {
  const openTab = getOpenTab();
  GM_setValue(AUTO_FILL_FORM, 1);
  setTimeout(() => {
    openTab(`${getBangumiHost()}/new_subject/${type}`);
  }, delay);
}

async function submitSubjectCreation({
  wikiData,
  queryInfo,
  payload,
  shouldCheckDup,
}: SubjectCreateInput) {
  const host = getBangumiHost();
  const subjectCreationRuntime = createUserScriptSubjectCreationRuntime(host);
  if (shouldCheckDup) {
    await checkSubjectAndOpenEntry(
      {
        subjectInfo: queryInfo,
        type: wikiData.type,
        disableDate: payload?.disableDate,
        auxSite: payload?.auxSite,
        draft: wikiData,
      },
      subjectCreationRuntime
    );
    return;
  }
  await userScriptRuntimeCapabilities.storage.saveSubjectDraft(wikiData);
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
  await userScriptRuntimeCapabilities.storage.saveCharacterDraft(charaData);
  await sleep(200);
  GM_openInTab(`${getBangumiHost()}/character/new`);
}

function createUserScriptSubjectCreationRuntime(
  host: string
): SubjectCreationRuntime {
  const notify =
    userScriptRuntimeCapabilities.notifier?.notify ?? logMessage;
  const openTab = getOpenTab();
  return {
    bangumi: {
      host,
      accessToken: GM_getValue<string>(BGM_ACCESS_TOKEN)?.trim(),
      useLegacyJsonSearch: GM_getValue<boolean>(USE_LEGACY_JSON_SEARCH) !== false,
      fallbackToPersonWorks: GM_getValue<boolean>(FALLBACK_TO_PERSON_WORKS) === true,
      fallbackToWebSearch:
        GM_getValue<boolean>(FALLBACK_TO_WEB_SEARCH) || false,
    },
    notify,
    chooseSubject: chooseSubjectCandidate,
    updateAuxData,
    saveSubjectDraft: (draft) =>
      userScriptRuntimeCapabilities.storage.saveSubjectDraft(draft),
    saveSubjectId(subjectId) {
      return userScriptRuntimeCapabilities.storage.saveSubjectId(subjectId);
    },
    async openExistingSubject(url: string) {
      await sleep(100);
      await openTab(host + url);
    },
    openNewSubject(type: SubjectTypeId) {
      return openNewSubject(type);
    },
  };
}

function createUserScriptPersonCreationRuntime(
  host: string
): PersonCreationRuntime {
  const notify =
    userScriptRuntimeCapabilities.notifier?.notify ?? logMessage;
  const openTab = getOpenTab();
  return {
    bangumi: {
      host,
    },
    notify,
    discardPersonDraft() {
      return userScriptRuntimeCapabilities.storage.clearPersonDraft();
    },
    async openExistingPerson(url: string) {
      await sleep(100);
      await openTab(host + url);
    },
    async openNewPerson() {
      GM_setValue(AUTO_FILL_FORM, 1);
      await sleep(200);
      await openTab(`${host}/person/new`);
    },
  };
}

async function submitPersonCreation({
  personData,
  queryInfo,
  shouldCheckDup,
}: PersonCreateInput) {
  const host = getBangumiHost();
  const personCreationRuntime = createUserScriptPersonCreationRuntime(host);
  await userScriptRuntimeCapabilities.storage.savePersonDraft(personData);
  if (shouldCheckDup) {
    await checkPersonAndOpenEntry(
      { name: queryInfo.name },
      personCreationRuntime
    );
    return;
  }
  await personCreationRuntime.openNewPerson();
}

export const userScriptRuntimeAdapter: SourceRuntimeAdapter = {
  fetchHtml(url: string) {
    return userScriptRuntimeCapabilities.transport.fetchHtml(url);
  },
  submitSubjectCreation,
  submitCharacterCreation,
  submitPersonCreation,
};
