import {amazonSubjectModel} from "./models/amazonJpBook";
import {getchuGameModel} from "./models/getchuGame";
import {initCommon, addStyle} from "./user-script";
import {bangumi} from "./user-script/bangumi";
import {BGM_DOMAIN, PROTOCOL} from "./user-script/constraints";

function setDomain() {
  bgm_domain = prompt(
    '预设bangumi的地址是 "' + 'bgm.tv' + '". 根据需要输入bangumi.tv',
    'bgm.tv'
  );
  GM_setValue('bgm', bgm_domain);
  return bgm_domain;
}
function setProtocol() {
  var p = prompt(
    `预设的 bangumi 页面协议是https 根据需要输入 http`,
    'https'
  );
  GM_setValue(PROTOCOL, p);
}
var bgm_domain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
// if (!bgm_domain.length || !bgm_domain.match(/bangumi\.tv|bgm\.tv/)) {
//   bgm_domain = setDomain();
//   bgm_domain = GM_getValue(BGM_DOMAIN);
// }
if (GM_registerMenuCommand) {
  GM_registerMenuCommand("\u8bbe\u7f6e\u57df\u540d", setDomain, 'b');
  GM_registerMenuCommand("新建条目页面(http 或者 https)", setProtocol, 'h');
}

const init = async () => {
  const re = new RegExp([
    'getchu.com',
    'bangumi\\.tv', 'bgm\\.tv', 'chii\\.tv',
    'amazon\\.co\\.jp'
  ].join('|'));
  const page = document.location.host.match(re);
  if (page) {
    addStyle();
    switch (page[0]) {
      case 'amazon.co.jp':
        initCommon(amazonSubjectModel, 'amazon_jp_book');
        break;
      case 'getchu.com':
        initCommon(getchuGameModel, 'getchu_game');
        break
      case 'bangumi.tv':
      case 'chii.tv':
      case 'bgm.tv':
        bangumi.init();
        break;
      default:
      // bangumi.init();
    }
  }
}
init()
