import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import { date, dom, fieldKind, firstOf } from '../core/extraction';

const attr = dom('#thing-modify').find('.thing-item .desc-item .label');
const attrValue = (key: string | string[]) => attr.hasText(key).next();

export const doubanGameEditSubject: SubjectSourceDefinition = {
  key: 'douban_game_edit',
  description: 'douban game edit',
  host: ['douban.com', 'www.douban.com'],
  urlRules: [/\/game\/\d+\/edit/],
  type: SubjectTypeId.game,
  pageSource: dom('#content h1'),
  controlSource: dom('#content h1'),
  itemList: [
    {
      name: '游戏名',
      source: firstOf([attrValue('原名'), attrValue('中文名')]),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_title' },
    },
    {
      name: '发行日期',
      source: firstOf([attrValue('发行日期'), attrValue('预计上市时间')]),
      parse: date(),
      emit: { category: 'date' },
    },
    {
      name: '平台',
      source: attrValue('平台'),
      emit: { category: 'platform' },
    },
    {
      name: '中文名',
      source: attrValue('中文名'),
      emit: { category: 'alias' },
    },
    {
      name: '别名',
      source: attrValue('别名'),
      emit: { category: 'alias' },
    },
    {
      name: '游戏类型',
      source: attrValue('类型'),
    },
    {
      name: '开发',
      source: attrValue('开发商'),
    },
    {
      name: '发行',
      source: attrValue('发行商'),
    },
    {
      name: 'cover',
      source: attrValue('图标').scope(dom('img')),
      kind: fieldKind.cover(),
      emit: { category: 'cover' },
    },
  ],
};
