import { SubjectTypeId } from '../interface/wiki';
import { AuxSitePayload } from '../interface/types';
import { RuntimeNotifyPayload, RuntimeCapabilities } from '../runtime/capabilities';
import { BrowserConfig, buildBangumiHost } from '../runtime/browserConfig';
import { SubjectCreationRuntime } from '../runtime/subjectCreation';
import { updateSubjectDraftFromAuxSite } from '../runtime/auxData';

export type SubjectRuntimeDeps = {
  getConfig: () => BrowserConfig;
  createCapabilities: (opts: {
    active: boolean;
    notify: (payload: RuntimeNotifyPayload) => Promise<void>;
  }) => RuntimeCapabilities;
  sendMsgToCurrentTab: (payload: RuntimeNotifyPayload) => Promise<void>;
  updateAuxDataDraft?: typeof updateSubjectDraftFromAuxSite;
  notify: (payload: RuntimeNotifyPayload) => void | Promise<void>;
  openTab: (url: string) => Promise<void>;
};

export function buildSubjectCreationRuntime(
  deps: SubjectRuntimeDeps
): SubjectCreationRuntime {
  const { getConfig, createCapabilities, sendMsgToCurrentTab, notify, openTab } = deps;
  const updateAuxDataDraft = deps.updateAuxDataDraft ?? updateSubjectDraftFromAuxSite;
  const userConfig = getConfig();
  const bgmHost = buildBangumiHost(userConfig);

  const capabilities = createCapabilities({
    active: userConfig.activeOpen,
    notify: sendMsgToCurrentTab,
  });

  async function updateAuxData(payload: AuxSitePayload) {
    const caps = createCapabilities({
      active: userConfig.activeOpen,
      notify: sendMsgToCurrentTab,
    });
    if (!caps.notifier) {
      throw new Error('background notifier capability is missing');
    }
    await updateAuxDataDraft(payload, {
      storage: caps.storage,
      notifier: caps.notifier,
    });
  }

  return {
    bgmHost,
    notify,
    updateAuxData,
    saveSubjectId(subjectId) {
      return capabilities.storage.saveSubjectId(subjectId);
    },
    async openExistingSubject(url: string) {
      await openTab(bgmHost + url);
    },
    async openNewSubject(type: SubjectTypeId) {
      await openTab(`${bgmHost}/new_subject/${type}`);
    },
  };
}
