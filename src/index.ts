import { amazonSubjectModel } from './models/amazonJpBook';
import { getchuGameModel } from './models/getchuGame';
import { initCommon, addStyle } from './user-script';
import { bangumi } from './user-script/bangumi';
import { BGM_DOMAIN, PROTOCOL } from './user-script/constraints';
import { erogamescapeModel } from './models/erogamescape';
import { getchu } from './user-script/getchu';
import { configs, findModelByHost } from './models';
import { steamdbModel } from './models/steamdb';
import { getSteamURL, getSteamdbURL } from './sites/steam';
import { steamModel } from './models/steam';

function setDomain() {
  bgm_domain = prompt(
    '预设bangumi的地址是 "' + 'bgm.tv' + '". 根据需要输入bangumi.tv',
    'bgm.tv'
  );
  GM_setValue('bgm', bgm_domain);
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
  GM_registerMenuCommand('\u8bbe\u7f6e\u57df\u540d', setDomain, 'b');
  GM_registerMenuCommand('新建条目页面(http 或者 https)', setProtocol, 'h');
}

// common
const hostArr: string[] = [];
Object.keys(configs).forEach((key: string) =>
  hostArr.push(...configs[key].host)
);
const siteRe = new RegExp(
  [...hostArr, 'bangumi.tv', 'bgm.tv', 'chii.tv']
    .map((h) => h.replace('.', '\\.'))
    .join('|')
);
const init = async () => {
  const page = document.location.host.match(siteRe);
  if (page) {
    addStyle();
    switch (page[0]) {
      case 'amazon.co.jp':
        initCommon(amazonSubjectModel);
        break;
      case 'getchu.com':
        initCommon(getchuGameModel);
        getchu.init(getchuGameModel);
        break;
      case 'erogamescape.org':
      case 'erogamescape.dyndns.org':
        initCommon(erogamescapeModel);
        break;
      case 'steamdb.info':
        initCommon(steamdbModel, {
          payload: {
            disableDate: true,
            auxSite: getSteamURL(window.location.href),
          },
        });
        break;
      case 'store.steampowered.com':
        initCommon(steamModel, {
          payload: {
            disableDate: true,
            auxSite: getSteamdbURL(window.location.href),
          },
        });
        break;
      case 'bangumi.tv':
      case 'chii.tv':
      case 'bgm.tv':
        bangumi.init();
        break;
      default:
        const modelArr = findModelByHost(page[0]);
        if (modelArr && modelArr.length) {
          modelArr.forEach((m) => {
            initCommon(m);
          });
        }
    }
  }
};
init();
