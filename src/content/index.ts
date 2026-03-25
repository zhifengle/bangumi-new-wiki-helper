import browser from 'webextension-polyfill';
import { findModelByHost } from '../models';
import { getchuGameModel } from '../models/getchuGame';
import { initSourceSubject } from '../source/subject';
import { logMessage } from '../utils/log';
import { initChara } from './character';
import { getchu } from './getchu';
import { contentRuntimeAdapter } from './runtimeAdapter';

const init = function () {
  const modelArr = findModelByHost(window.location.hostname);
  if (modelArr && modelArr.length) {
    modelArr.forEach((model) => {
      initSourceSubject(model, contentRuntimeAdapter);
      initChara(model);
    });
  }
  // @TODO remove check
  if (location.hostname === 'www.getchu.com') {
    getchu.init(getchuGameModel);
  }
};
init();

browser.runtime.onMessage.addListener(logMessage);
