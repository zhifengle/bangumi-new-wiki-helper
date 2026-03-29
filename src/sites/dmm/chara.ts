import {
  CharacterSourceDefinition,
  Selector,
  SubjectTypeId,
} from '../../interface/wiki';

const modernCharacterSectionSelector: Selector = {
  selector: '#detailGuide .detailGuide__content',
  subSelector: '.detailGuide__capt',
  keyWord: 'キャラクター',
  sibling: true,
};

const modernCharacterToolbarSelector: Selector = {
  selector: '#detailGuide .detailGuide__content',
  subSelector: '.detailGuide__capt',
  keyWord: 'キャラクター',
};

const modernCharacterItemSelector: Selector = {
  ...modernCharacterSectionSelector,
  nextSelector: {
    selector: '.detailGuide__box-chr',
  },
};

export const dmmChara: CharacterSourceDefinition = {
  key: 'dmm_game_chara',
  siteKey: 'dmm_game',
  description: 'dmm 游戏角色',
  type: SubjectTypeId.game,
  itemSelector: modernCharacterItemSelector,
  presenceSelector: modernCharacterItemSelector,
  toolbarSelector: modernCharacterToolbarSelector,
  itemList: [],
};

// 限定父节点
dmmChara.itemList.push(
  {
    name: '姓名',
    selector: {
      selector: '.detailGuide__tx16.detailGuide__bold.detailGuide__lin-hgt',
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

