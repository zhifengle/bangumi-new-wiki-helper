import { CharaModel } from '../interface/wiki';

export const dlsiteGameCharaModel: CharaModel = {
  key: 'dlsite_game_chara',
  siteKey: 'dlsite_game',
  description: 'dlsite游戏角色',
  host: ['dlsite.com', 'www.dlsite.com'],
  type: 'character',
  itemSelector: {
    selector: '.work_parts_multiimage_item',
  },
  controlSelector: [
    {
      selector: '#work_name',
    },
  ],
  itemList: [],
};

// 限定父节点
// dlsiteGameCharaModel.itemList.push({
//   name: '姓名',
//   selector: {
//     selector: 'p',
//   },
//   pipes: [
//     function (pipe: ITextPipe): ITextPipe {
//       let str = getStr(pipe);
//       return {
//         ...pipe,
//         out: str.split('\n')[0],
//       };
//     },
//   ],
//   category: 'crt_name',
// });
