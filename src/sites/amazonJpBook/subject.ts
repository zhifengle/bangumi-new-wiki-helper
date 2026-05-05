import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import {
  cleanText,
  date,
  dom,
  fieldKind,
  firstOf,
  number,
  removeParenthesis,
  strip,
  trim,
  trimAllSpace,
} from '../core/extraction';
import { amazonUtils } from '../amazon/shared';

const detailRows = [
  dom('#richProductInformation_feature_div').find('ol.a-carousel li'),
  dom('#detailBullets_feature_div .detail-bullet-list').find('li .a-list-item'),
  dom('#detail_bullets_id .bucket .content').find('li'),
];

const detailValue = (key: string | string[]) =>
  firstOf(detailRows.map((source) => source.hasText(key)));
const cleanDetailValue = (key: string | string[]) =>
  cleanText.chain([strip(key), trim()]);
const cleanCompactDetailValue = (key: string | string[]) =>
  cleanText.chain([strip(key), trimAllSpace()]);

const bylineRole = (role: string | RegExp) =>
  dom('#bylineInfo')
    .find('.author')
    .hasText(role)
    .scope(firstOf([dom('.contributorNameID'), dom('a'), dom('.a-link-normal')]));

export const amazonJpBookSubject: SubjectSourceDefinition = {
  key: 'amazon_jp_book',
  host: ['amazon.co.jp', 'www.amazon.co.jp'],
  description: '日亚图书',
  type: SubjectTypeId.book,
  pageSource: firstOf([
    dom('#nav-subnav .nav-a:first-child')
      .find('.nav-a-content')
      .hasText(['本', '书', '漫画', 'マンガ', 'Audible']),
    dom('#wayfinding-breadcrumbs_container .a-unordered-list .a-list-item:first-child')
      .find('.a-link-normal')
      .hasText(['本', '书', '漫画', 'マンガ', 'Audible']),
  ]),
  controlSource: dom('#title'),
  itemList: [
    {
      name: '名称',
      source: dom('#productTitle'),
      kind: fieldKind.preservedText(),
      transform: (value) =>
        typeof value === 'string' ? amazonUtils.dealTitle(value) : value,
      emit: { category: 'subject_title' },
    },
    {
      name: 'ASIN',
      source: detailValue(['ASIN', 'ISBN-10']),
      clean: cleanCompactDetailValue(['ASIN', 'ISBN-10']),
      emit: { category: 'ASIN' },
    },
    {
      name: 'ISBN',
      source: detailValue('ISBN-13'),
      clean: cleanCompactDetailValue('ISBN-13'),
      emit: { category: 'ISBN' },
    },
    {
      name: '发售日',
      source: detailValue(['発売日', '出版日期', '配信日']),
      clean: cleanText.chain([
        trimAllSpace(),
        strip(['発売日', '出版日期', '配信日']),
        removeParenthesis(),
      ]),
      parse: date(),
      emit: { category: 'date' },
    },
    {
      name: '出版社',
      source: firstOf([
        bylineRole(/\(出版社\)/),
        detailValue('出版社'),
      ]),
      clean: cleanDetailValue('出版社'),
    },
    {
      name: '页数',
      source: detailValue(['ページ', '页']),
      parse: number({ rejectIfIncludes: '予約商品', maxInputLength: 20 }),
    },
    {
      name: '播放时长',
      source: detailValue(['再生時間']),
      clean: cleanCompactDetailValue(['再生時間']),
      transform: (value) =>
        typeof value === 'string'
          ? value.replace('時間', '小时').replace(/ /g, '')
          : value,
    },
    {
      name: '演播',
      source: detailValue(['ナレーター']),
      clean: cleanText.chain([trimAllSpace(), strip(['ナレーター'])]),
    },
    {
      name: '作者',
      source: firstOf([
        bylineRole(/\(著\)/),
        dom('#byline .author span.a-size-medium'),
        dom('#bylineInfo .author > a'),
        dom('#bylineInfo .contributorNameID'),
      ]),
      emit: { category: 'creator' },
    },
    {
      name: '插图',
      source: bylineRole('イラスト'),
      emit: { category: 'creator' },
    },
    {
      name: '价格',
      source: firstOf([
        dom('#tmmSwatches .a-button-selected .slot-price'),
        dom('#tmm-grid-swatch-OTHER .slot-price'),
        dom('#tmm-grid-swatch-PAPERBACK .slot-price'),
        dom('#tmmSwatches > div > div:last-child .slot-price'),
      ]),
      clean: cleanText.chain([trimAllSpace()]),
      transform: (value) =>
        typeof value === 'string' ? value.replace(/来自|より/, '').trim() : value,
    },
    {
      name: '内容简介',
      source: firstOf([
        dom('#productDescription').find('h3').hasText(['内容紹介', '内容']).next(),
        dom('#bookDescription_feature_div .a-expander-content'),
        dom('#bookDesc_iframe').iframeBody().scope(dom('#iframeContent')),
      ]),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_summary' },
    },
  ],
};
