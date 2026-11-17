import { initCommon, addStyle } from './user-script';
import { bangumi } from './user-script/bangumi';
import { findModelByHost, findPersonModels } from './sites';
import { initChara } from './user-script/character';
import { initPerson } from './user-script/person';
import { openLinkedTokenSettings, showSettingsDialog } from './user-script/settingsDialog';
import { SHOW_EXPORT_BUTTONS } from './user-script/constants';
import { setExportButtonsVisible } from './sites/core/controls';

if (GM_registerMenuCommand) {
  GM_registerMenuCommand('条目助手设置', () => showSettingsDialog());
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
  const personModels = findPersonModels(host, window.location.href);
  if (modelArr.length || personModels.length) {
    const syncExportButtons = () =>
      setExportButtonsVisible(GM_getValue<boolean>(SHOW_EXPORT_BUTTONS) === true);
    syncExportButtons();
    window.addEventListener('focus', syncExportButtons);
  }
  if (modelArr && modelArr.length) {
    ensureStyle();
    modelArr.forEach((m) => {
      initCommon(m);
      initChara(m);
    });
  }
  if (personModels.length) {
    ensureStyle();
    personModels.forEach((m) => {
      initPerson(m);
    });
  }
  if (['bangumi.tv', 'chii.in', 'bgm.tv'].includes(host)) {
    ensureStyle();
    openLinkedTokenSettings();
    bangumi.init();
  }
};
init();
