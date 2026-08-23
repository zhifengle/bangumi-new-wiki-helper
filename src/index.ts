import { initCommon, addStyle } from './user-script';
import { bangumi } from './user-script/bangumi';
import { findModelByHost } from './sites';
import { initChara } from './user-script/character';
import { showSettingsDialog } from './user-script/settingsDialog';

if (GM_registerMenuCommand) {
  GM_registerMenuCommand('条目助手设置', showSettingsDialog);
}

const init = async () => {
  const host = window.location.hostname;
  const modelArr = findModelByHost(host);
  if (modelArr && modelArr.length) {
    addStyle();
    modelArr.forEach((m) => {
      initCommon(m);
      initChara(m);
    });
  }
  if (['bangumi.tv', 'chii.in', 'bgm.tv'].includes(host)) {
    addStyle();
    bangumi.init();
  }
};
init();
