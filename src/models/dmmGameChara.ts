import { CharaModel } from '../interface/wiki';

export const dmmGameCharaModel: CharaModel = {
  key: 'dmm_game_chara',
  siteKey: 'dmm_game',
  description: 'dmm 游戏角色',
  type: 'character',
  itemSelector: {
    selector: '#if_view',
    isIframe: true,
    subSelector: 'body',
  },
  controlSelector: [
    {
      selector: '#if_view',
      isIframe: true,
      subSelector: 'body',
      nextSelector: {
        selector: '.guide-content',
        subSelector: 'guide-capt',
        keyWord: 'キャラクター',
      },
    },
  ],
  itemList: [],
};

// 限定父节点
dmmGameCharaModel.itemList.push({
  name: 'cover',
  selector: {
    selector: '.image img',
  },
  category: 'crt_cover',
});
