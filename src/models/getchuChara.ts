import { CharaModel } from '../interface/wiki';

export const getchuCharaModel: CharaModel = {
  key: 'getchu_chara',
  siteKey: 'getchu_game',
  description: 'getchu 游戏角色',
  type: 'character',
  itemSelector: {
    selector: '#wrapper',
    subSelector: '.tabletitle',
    keyWord: 'キャラクター',
    sibling: true,
    nextSelector: {
      selector: 'tr',
    },
  },
  controlSelector: [
    {
      selector: '#wrapper',
      subSelector: '.tabletitle',
      keyWord: 'キャラクター',
    },
  ],
  itemList: [],
};

// 限定父节点
// getchuCharaModel.itemList.push(
//   {
//     name: 'cover',
//     selector: {
//       selector: 'td > img',
//     },
//     category: 'crt_cover',
//   }
// );
