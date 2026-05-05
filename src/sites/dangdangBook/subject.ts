import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import { date, dom, fieldKind } from '../core/extraction';
import { dangdangTitle } from './tools';

const info = dom('.messbox_info').find('span');
const desc = dom('#detail_describe').find('li');

export const dangdangBookSubject: SubjectSourceDefinition = {
  key: 'dangdang_book',
  host: ['product.dangdang.com'],
  description: '当当图书',
  type: SubjectTypeId.book,
  pageSource: dom('#breadcrumb').find('a').hasText('图书'),
  controlSource: dom('.name_info h1'),
  itemList: [
    {
      name: '名称',
      source: dom('.name_info h1'),
      kind: fieldKind.preservedText(),
      transform: (value) =>
        typeof value === 'string' ? dangdangTitle(value) : value,
      emit: { category: 'subject_title' },
    },
    {
      name: 'ISBN',
      source: desc.hasText('国际标准书号ISBN'),
      emit: { category: 'ISBN' },
    },
    {
      name: '发售日',
      source: info.hasText('出版时间'),
      parse: date(),
      emit: { category: 'date' },
    },
    {
      name: '作者',
      source: info.hasText('作者'),
    },
    {
      name: '出版社',
      source: info.hasText('出版社'),
    },
    {
      name: '内容简介',
      source: dom('#content .descrip'),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_summary' },
    },
  ],
};
