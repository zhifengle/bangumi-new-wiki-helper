import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import { dateFromFirstMatch, dom, fieldKind, firstOf, meta } from '../core/extraction';
import { cleanupDmmSubjectSummary } from './tools';

const modernTitle = dom('h1.productTitle__item--headline');
const classicInfo = (key: string[]) =>
  dom('.main-area-center .container02 table')
    .find('tr')
    .hasText(key)
    .scope(dom('.type-right'));
const modernInfo = (key: string[]) =>
  dom('.productLayout__secondaryColumn')
    .find('.contentsDetailTop__tableDataLeft > p, .contentsDetailBottom__tableDataLeft > p')
    .hasText(key)
    .closest('.contentsDetailTop__tableRow, .contentsDetailBottom__tableRow')
    .scope(dom('.contentsDetailTop__tableDataRight, .contentsDetailBottom__tableDataRight'));
const infoValue = (key: string[]) => firstOf([classicInfo(key), modernInfo(key)]);

export const dmmSubject: SubjectSourceDefinition = {
  key: 'dmm_game',
  description: 'dmm游戏',
  host: ['dlsoft.dmm.co.jp'],
  type: SubjectTypeId.game,
  pageSource: firstOf([
    dom('.ntgnav-mainItem.is-active').find('span').hasText('ゲーム'),
    modernTitle,
  ]),
  controlSource: firstOf([dom('h1#title'), modernTitle.closest('.productTitle')]),
  itemList: [
    {
      name: '游戏名',
      source: firstOf([
        dom('#title'),
        modernTitle,
        meta({ property: 'og:title' }),
      ]),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_title' },
    },
    {
      name: '开发',
      source: infoValue(['ブランド']),
    },
    {
      name: '发行日期',
      source: infoValue(['配信開始日']),
      parse: dateFromFirstMatch(),
      emit: { category: 'date' },
    },
    {
      name: '游戏类型',
      source: infoValue(['ゲームジャンル']),
    },
    {
      name: '原画',
      source: infoValue(['原画']),
    },
    {
      name: '剧本',
      source: infoValue(['シナリオ', '剧情']),
    },
    {
      name: '游戏简介',
      source: dom('.read-text-area .text-overflow'),
      kind: fieldKind.preservedText(),
      transform: (value) =>
        typeof value === 'string' ? cleanupDmmSubjectSummary(value) : value,
      emit: { category: 'subject_summary' },
    },
  ],
  defaults: [
    {
      name: '平台',
      value: 'PC',
      category: 'platform',
    },
    {
      name: 'subject_nsfw',
      value: '1',
      category: 'checkbox',
    },
  ],
};
