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
    nextSelector: {
      selector: '.guide-sect .guide-box-chr',
    },
  },
  controlSelector: [
    {
      selector: '#title',
    },
    // {
    //   selector: '#if_view',
    //   isIframe: true,
    //   subSelector: 'body',
    //   nextSelector: {
    //     selector: '.guide-content',
    //     subSelector: 'guide-capt',
    //     keyWord: 'キャラクター',
    //   },
    // },
  ],
  itemList: [],
};

// 限定父节点
dmmGameCharaModel.itemList.push(
  {
    name: '姓名',
    selector: {
      selector: '.guide-tx16.guide-bold.guide-lin-hgt',
    },
    category: 'crt_name',
    pipes: ['p', 'ta'],
  },
  {
    name: 'cover',
    selector: {
      selector: 'img',
    },
    category: 'crt_cover',
  }
);
