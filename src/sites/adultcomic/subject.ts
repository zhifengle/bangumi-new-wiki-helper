import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import {
  date,
  dom,
  fieldKind,
  firstOf,
  number,
  strip,
  cleanText,
} from '../core/extraction';

const info = dom('#info-table > div.info-box > dl').find('dt');
const infoValue = (key: string | string[]) => info.hasText(key).next();

export const adultComicSubject: SubjectSourceDefinition = {
  key: 'adultcomic',
  description: 'adultcomic',
  host: ['adultcomic.dbsearch.net'],
  type: SubjectTypeId.book,
  pageSource: dom('#pankuz > ol > li:nth-child(1) > a[href*="adultcomic.dbsearch.net"]'),
  controlSource: firstOf([dom('#h2-icon-bk'), dom('#h2-icon-wk')]),
  itemList: [
    {
      name: '名称',
      source: dom('#h2-icon-bk'),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_title' },
    },
    {
      name: 'cover',
      source: firstOf([
        dom('#sample-image > figure > a'),
        dom('#info-table > .img-box > img'),
      ]),
      kind: fieldKind.cover(),
      emit: { category: 'cover' },
    },
    {
      name: 'ISBN',
      source: infoValue('ISBN'),
      emit: { category: 'ISBN' },
    },
    {
      name: '发售日',
      source: infoValue('発売日'),
      clean: cleanText.standard(strip('発売日')),
      parse: date(),
      emit: { category: 'date' },
    },
    { name: '出版社', source: infoValue('出版社') },
    { name: '书系', source: infoValue(['レーベル']) },
    {
      name: '页数',
      source: infoValue(['ページ']),
      parse: number(),
    },
    {
      name: '作者',
      source: firstOf([
        dom('#info-table > div.info-box .author-list > li'),
        infoValue('漫画家'),
      ]),
      emit: { category: 'creator' },
    },
    { name: '价格', source: infoValue('本体価格') },
    {
      name: '内容简介',
      source: dom('#comment-clist > .iteminfo-box').find('h4').hasText(['内容紹介']).next(),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_summary' },
    },
  ],
};
