import { initCommon, addStyle } from './user-script';
import { bangumi } from './user-script/bangumi';
import { findModelByHost, findPersonModels } from './sites';
import { initChara } from './user-script/character';
import { initPerson } from './user-script/person';
import { showSettingsDialog } from './user-script/settingsDialog';

if (GM_registerMenuCommand) {
  GM_registerMenuCommand('条目助手设置', showSettingsDialog);
}

const init = async () => {
  const host = window.location.hostname;
  let styled = false;
  const ensureStyle = () => {
    if (!styled) {
      addStyle();
      styled = true;
    }
  };
  const modelArr = findModelByHost(host);
  if (modelArr && modelArr.length) {
    ensureStyle();
    modelArr.forEach((m) => {
      initCommon(m);
      initChara(m);
    });
  }
  const personModels = findPersonModels(host, window.location.href);
  if (personModels.length) {
    ensureStyle();
    personModels.forEach((m) => {
      initPerson(m);
    });
  }
  if (['bangumi.tv', 'chii.in', 'bgm.tv'].includes(host)) {
    ensureStyle();
    bangumi.init();
  }
};
init();
