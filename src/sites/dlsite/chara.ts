import { CharacterSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import { dom, fieldKind } from '../core/extraction';

export const dlsiteChara: CharacterSourceDefinition = {
  key: 'dlsite_game_chara',
  siteKey: 'dlsite_game',
  description: 'dlsite游戏角色',
  host: ['dlsite.com', 'www.dlsite.com'],
  type: SubjectTypeId.game,
  itemSource: dom('.work_parts_multiimage_item').allItems(),
  toolbarSource: dom('.work_parts.type_multiimages *:first-child'),
  itemList: [
    {
      name: 'cover',
      source: dom('.image img'),
      kind: fieldKind.cover(),
      emit: { category: 'crt_cover' },
    },
  ],
};
