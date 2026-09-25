import browser from 'webextension-polyfill';
import { findModelByHost, findPersonModels } from '../sites';
import { initSourceSubject } from '../source/subject';
import { logMessage } from '../utils/log';
import { initChara } from './character';
import { initPerson } from './person';
import { contentRuntimeAdapter } from './runtimeAdapter';

const init = function () {
  const modelArr = findModelByHost(window.location.hostname);
  if (modelArr && modelArr.length) {
    modelArr.forEach((model) => {
      initSourceSubject(model, contentRuntimeAdapter);
      initChara(model);
    });
  }
  findPersonModels(window.location.hostname, window.location.href).forEach(
    (model) => {
      initPerson(model);
    }
  );
};
init();

browser.runtime.onMessage.addListener(logMessage);
