import { initCommon, addStyle } from './user-script';
import { bangumi } from './user-script/bangumi';
import { BGM_DOMAIN, PROTOCOL } from './user-script/constraints';
import { findModelByHost } from './models';
import { getchuGameModel } from './models/getchuGame';
import { getchu } from './user-script/getchu';
import { initChara } from './user-script/character';

function setDomain() {
  bgm_domain = prompt(
    '预设bangumi的地址是 "' + 'bgm.tv' + '". 根据需要输入bangumi.tv',
    'bgm.tv'
  );
  GM_setValue(BGM_DOMAIN, bgm_domain);
  return bgm_domain;
}

function setProtocol() {
  var p = prompt(`预设的 bangumi 页面协议是https 根据需要输入 http`, 'https');
  GM_setValue(PROTOCOL, p);
}

var bgm_domain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';

// if (!bgm_domain.length || !bgm_domain.match(/bangumi\.tv|bgm\.tv/)) {
//   bgm_domain = setDomain();
//   bgm_domain = GM_getValue(BGM_DOMAIN);
// }

if (GM_registerMenuCommand) {
  GM_registerMenuCommand('设置 Bangumi 域名', setDomain, 'b');
  GM_registerMenuCommand('新建条目页面(http 或者 https)', setProtocol, 'h');
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
  if (['bangumi.tv', 'chii.tv', 'bgm.tv'].includes(host)) {
    addStyle();
    bangumi.init();
    // @TODO remove check
  } else if (host === 'www.getchu.com') {
    getchu.init(getchuGameModel);
  }
};
init();
