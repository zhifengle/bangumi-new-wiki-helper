import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import { date, dom, fieldKind, firstOf } from '../core/extraction';

const attr = dom('#content .thing-attr').find('dt');
const attrValue = (key: string | string[]) => attr.hasText(key).next();

export const doubanGameSubject: SubjectSourceDefinition = {
  key: 'douban_game',
  description: 'douban game',
  host: ['douban.com', 'www.douban.com'],
  type: SubjectTypeId.game,
  pageSource: dom('#content h1'),
  controlSource: dom('#content h1'),
  itemList: [
    {
      name: '游戏名',
      source: dom('#content h1'),
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
      name: '游戏简介',
      source: dom('.mod.item-desc').find('h2').hasText('简介').next(),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_summary' },
    },
    {
      name: 'cover',
      source: dom('#content .item-subject-info .pic > a'),
      kind: fieldKind.cover(),
      emit: { category: 'cover' },
    },
  ],
};
