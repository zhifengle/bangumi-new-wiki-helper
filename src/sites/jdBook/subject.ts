import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import { cleanText, date, dom, fieldKind, strip } from '../core/extraction';
import { jdTitle } from './tools';

const desc = dom('#parameter2').find('li');

export const jdBookSubject: SubjectSourceDefinition = {
  key: 'jd_book',
  host: ['item.jd.com'],
  description: '京东图书',
  type: SubjectTypeId.book,
  pageSource: dom('#crumb-wrap').find('.item > a').hasText('图书'),
  controlSource: dom('#name .sku-name'),
  itemList: [
    {
      name: '名称',
      source: dom('#name .sku-name'),
      kind: fieldKind.preservedText(),
      transform: (value) => (typeof value === 'string' ? jdTitle(value) : value),
      emit: { category: 'subject_title' },
    },
    {
      name: 'ISBN',
      source: desc.hasText('ISBN'),
      emit: { category: 'ISBN' },
    },
    {
      name: '发售日',
      source: desc.hasText('出版时间'),
      parse: date(),
      emit: { category: 'date' },
    },
    {
      name: '作者',
      source: dom('#p-author').hasText('著'),
      clean: cleanText.standard(strip('著')),
    },
    {
      name: '出版社',
      source: desc.hasText('出版社'),
    },
    {
      name: '内容简介',
      source: dom('.book-detail-item').find('.item-mt').hasText('内容简介').next(),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_summary' },
    },
  ],
};
