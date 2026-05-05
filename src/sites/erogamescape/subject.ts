import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import { attr, date, dom, fieldKind, firstOf } from '../core/extraction';

export const erogamescapeSubject: SubjectSourceDefinition = {
  key: 'erogamescape',
  description: 'erogamescape',
  host: ['erogamescape.org', 'erogamescape.dyndns.org'],
  type: SubjectTypeId.game,
  pageSource: dom('#soft-title'),
  controlSource: dom('#soft-title'),
  itemList: [
    {
      name: '游戏名',
      source: dom('#soft-title > span'),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_title' },
    },
    { name: '开发', source: dom('#brand a') },
    {
      name: '发行日期',
      source: dom('#sellday a'),
      parse: date(),
      emit: { category: 'date' },
    },
    {
      name: 'cover',
      source: dom('#image_and_basic_infomation img'),
      kind: fieldKind.cover(),
      emit: { category: 'cover' },
    },
    {
      name: 'website',
      source: firstOf([
        dom('#links').find('a').hasText('game_OHP'),
        dom('#bottom_inter_links_main').find('a').hasText('game_OHP'),
      ]),
      read: attr('href'),
      clean: false,
      emit: { category: 'website' },
    },
    { name: '原画', source: dom('#genga > td:last-child') },
    { name: '剧本', source: dom('#shinario > td:last-child') },
    { name: '歌手', source: dom('#kasyu > td:last-child') },
  ],
  defaults: [
    { name: '平台', value: 'PC', category: 'platform' },
    { name: 'subject_nsfw', value: '1', category: 'checkbox' },
  ],
};
