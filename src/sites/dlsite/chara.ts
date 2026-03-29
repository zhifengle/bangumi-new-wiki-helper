import { CharacterSourceDefinition, SubjectTypeId } from '../../interface/wiki';

export const dlsiteChara: CharacterSourceDefinition = {
  key: 'dlsite_game_chara',
  siteKey: 'dlsite_game',
  description: 'dlsite游戏角色',
  host: ['dlsite.com', 'www.dlsite.com'],
  type: SubjectTypeId.game,
  itemSelector: {
    selector: '.work_parts_multiimage_item',
  },
  toolbarSelector: [
    {
      selector: '.work_parts.type_multiimages *:first-child',
    },
    {
      selector: '#work_name',
    },
  ],
  itemList: [],
};

// 限定父节点
dlsiteChara.itemList.push({
  name: 'cover',
  selector: {
    selector: '.image img',
  },
  category: 'crt_cover',
});

