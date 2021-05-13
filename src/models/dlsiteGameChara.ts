import { CharaModel } from '../interface/wiki';

export const dlsiteGameCharaModel: CharaModel = {
  key: 'dlsite_game_chara',
  siteKey: 'dlsite_game',
  description: 'dlsite游戏角色',
  host: ['dlsite.com', 'www.dlsite.com'],
  type: 'character',
  pageSelectors: [
    {
      selector: '.floorTab-item.type-doujin.is-active',
    },
    {
      selector: '.floorTab-item.type-com.is-active',
    },
  ],
  controlSelector: [
    {
      selector: '#work_name',
    },
  ],
  itemList: [],
};

dlsiteGameCharaModel.itemList.push({
  name: '姓名',
  selector: {
    selector: '#work_name',
  },
  category: 'crt_name',
});

// dlsiteGameCharaModel.defaultInfos = [
//   {
//     name: '平台',
//     value: 'PC',
//     category: 'platform',
//   },
// ];
