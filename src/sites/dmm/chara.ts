import { CharacterSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import {
  cleanText,
  dom,
  fieldKind,
  firstOf,
  removeParenthesis,
  trimAllSpace,
} from '../core/extraction';

const characterSection = dom('#detailGuide .detailGuide__content')
  .find('.detailGuide__capt')
  .hasText('キャラクター')
  .next();

export const dmmChara: CharacterSourceDefinition = {
  key: 'dmm_game_chara',
  siteKey: 'dmm_game',
  description: 'dmm 游戏角色',
  type: SubjectTypeId.game,
  itemSource: characterSection.scope(dom('.detailGuide__box-chr').allItems()).allItems(),
  presenceSource: characterSection,
  toolbarSource: dom('#detailGuide .detailGuide__content')
    .find('.detailGuide__capt')
    .hasText('キャラクター'),
  itemList: [
    {
      name: '姓名',
      source: dom('.detailGuide__tx16.detailGuide__bold.detailGuide__lin-hgt'),
      clean: cleanText.chain([removeParenthesis(), trimAllSpace()]),
      emit: { category: 'crt_name' },
    },
    {
      name: 'cover',
      source: dom('img'),
      kind: fieldKind.cover(),
      emit: { category: 'crt_cover' },
    },
  ],
};
