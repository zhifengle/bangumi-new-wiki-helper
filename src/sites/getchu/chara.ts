import { CharacterSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import { dom } from '../core/extraction';

export const getchuChara: CharacterSourceDefinition = {
  key: 'getchu_game_chara',
  siteKey: 'getchu_game',
  description: 'Getchu 游戏角色',
  host: ['getchu.com', 'www.getchu.com'],
  controlMode: 'inline',
  type: SubjectTypeId.game,
  itemSource: dom('.chara-text .chara-name').allItems(),
  presenceSource: dom('#wrapper').find('.tabletitle').hasText(['キャラクター', '角色']).next(),
  itemList: [],
};
