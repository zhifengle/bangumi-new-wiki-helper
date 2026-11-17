import browser from 'webextension-polyfill';
import { findModelByHost, findPersonModels } from '../sites';
import { initSourceSubject } from '../source/subject';
import { chooseSubjectCandidate } from '../source/subjectCandidates';
import type { ChooseSubjectCandidateMessage } from '../interface/messages';
import type { RuntimeNotifyPayload } from '../runtime/capabilities';
import { logMessage } from '../utils/log';
import { initChara } from './character';
import { initPerson } from './person';
import { contentRuntimeAdapter } from './runtimeAdapter';
import type { BrowserStorageState } from '../runtime/browserConfig';
import { setExportButtonsVisible } from '../sites/core/controls';

const init = function () {
  const modelArr = findModelByHost(window.location.hostname);
  const personModels = findPersonModels(window.location.hostname, window.location.href);
  if (modelArr.length || personModels.length) {
    const applyExportConfig = (config: BrowserStorageState['config']) =>
      setExportButtonsVisible(config?.showExportButtons === true);
    let configChanged = false;
    browser.storage.onChanged.addListener(({ config }, area) => {
      if (area !== 'local' || !config) return;
      configChanged = true;
      applyExportConfig(config.newValue as BrowserStorageState['config']);
    });
    void browser.storage.local.get('config').then(({ config }: BrowserStorageState) => {
      if (!configChanged) applyExportConfig(config);
    }).catch(console.error);
  }
  if (modelArr && modelArr.length) {
    modelArr.forEach((model) => {
      initSourceSubject(model, contentRuntimeAdapter);
      initChara(model);
    });
  }
  personModels.forEach(
    (model) => {
      initPerson(model);
    }
  );
};
init();

browser.runtime.onMessage.addListener(
  (message: ChooseSubjectCandidateMessage | RuntimeNotifyPayload) =>
    'action' in message
      ? chooseSubjectCandidate(message.payload)
      : logMessage(message)
);
