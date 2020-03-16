import {amazon} from "./amazon";

const init = function () {
  const re = new RegExp([
    'getchu.com',
    'bangumi\\.tv', 'bgm\\.tv', 'chii\\.tv',
    'amazon\\.co\\.jp'
  ].join('|'));
  const page = document.location.host.match(re);
  if (page) {
    switch (page[0]) {
      case 'amazon.co.jp':
        amazon.init();
        break;
      case 'getchu.com':
        break
      case 'bangumi.tv':
      case 'chii.tv':
      case 'bgm.tv':
        // bangumi.init();
        break;
      default:
      // bangumi.init();
    }
  }
};
init();
