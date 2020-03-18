import {amazonSubjectModel} from "./models/amazonJpBook";
import {getchuGameModel} from "./models/getchuGame";
import {fetchText} from "./utils/fetchData";

const init = async () => {
  const re = new RegExp([
    'getchu.com',
    'bangumi\\.tv', 'bgm\\.tv', 'chii\\.tv',
    'amazon\\.co\\.jp'
  ].join('|'));
  const page = document.location.host.match(re);
  if (page) {
    switch (page[0]) {
      case 'amazon.co.jp':
        // initCommon(amazonSubjectModel, 'amazon_jp_book');
        break;
      case 'getchu.com':
        let r = await fetchText('http://www.getchu.com/soft.phtml?id=735329')
        console.log(r)
        // initCommon(getchuGameModel, 'getchu_game');
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
}
init()
