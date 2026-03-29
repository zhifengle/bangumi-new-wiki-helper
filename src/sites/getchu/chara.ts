import { CharacterSourceDefinition, SubjectTypeId } from '../../interface/wiki';

export const getchuChara: CharacterSourceDefinition = {
  key: 'getchu_game_chara',
  siteKey: 'getchu_game',
  description: 'Getchu 游戏角色',
  host: ['getchu.com', 'www.getchu.com'],
  controlMode: 'inline',
  type: SubjectTypeId.game,
  itemSelector: {
    selector: '.chara-text .chara-name',
  },
  presenceSelector: {
    selector: '#wrapper',
    subSelector: '.tabletitle',
    sibling: true,
    keyWord: ['キャラクター', '角色'],
  },
  itemList: [],
};

