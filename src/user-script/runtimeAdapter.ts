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
import { logMessage } from '../utils/log';
import { userScriptRuntimeCapabilities } from './runtimeCapabilities';
import {
  AUTO_FILL_FORM,
  BGM_DOMAIN,
  PROTOCOL,
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
  const bgmHost = getBangumiHost();
  const subjectCreationRuntime = createUserScriptSubjectCreationRuntime(bgmHost);
  await userScriptRuntimeCapabilities.storage.saveSubjectDraft(wikiData);
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
  await userScriptRuntimeCapabilities.storage.saveCharacterDraft(charaData);
  await sleep(200);
  GM_openInTab(`${getBangumiHost()}/character/new`);
}

function createUserScriptSubjectCreationRuntime(
  bgmHost: string
): SubjectCreationRuntime {
  const notify =
    userScriptRuntimeCapabilities.notifier?.notify ?? logMessage;
  const openTab = getOpenTab();
  return {
    bgmHost,
    notify,
    updateAuxData,
    saveSubjectId(subjectId) {
      return userScriptRuntimeCapabilities.storage.saveSubjectId(subjectId);
    },
    async openExistingSubject(url: string) {
      await sleep(100);
      await openTab(bgmHost + url);
    },
    openNewSubject(type: SubjectTypeId) {
      return openNewSubject(type);
    },
  };
}

export const userScriptRuntimeAdapter: SourceRuntimeAdapter = {
  fetchHtml(url: string) {
    return userScriptRuntimeCapabilities.transport.fetchHtml(url);
  },
  submitSubjectCreation,
  submitCharacterCreation,
};
