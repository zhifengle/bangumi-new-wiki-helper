import {getWikiItem} from "./sites/common";
import {SingleInfo} from "./interface/subject";
import {getchuGameModel} from "./models/getchuGame";

const init = () => {
  console.log('init')
  const infoList: (SingleInfo | void)[] = getchuGameModel.itemList.map(item => getWikiItem(item))
  console.log('infoList: ', infoList)
  const re = new RegExp(['getchu', 'bangumi', 'bgm', 'amazon'].join('|'));
  const page = document.location.host.match(re);
  if (page) {
    switch (page[0]) {
      case 'amazon':
        // amazon.init();
        break;
      case 'bangumi':
      case 'bgm':
        // bangumi.init();
        break;
      default:
    }
  }
}
init()
