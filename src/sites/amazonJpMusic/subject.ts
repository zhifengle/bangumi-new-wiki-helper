import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import {
  cleanText,
  dom,
  fieldKind,
  firstOf,
  strip,
  trimAllSpace,
} from '../core/extraction';

const detailRows = [
  dom('#richProductInformation_feature_div').find('ol.a-carousel li'),
  dom('#detailBullets_feature_div .detail-bullet-list').find('li .a-list-item'),
  dom('#detail_bullets_id .bucket .content').find('li'),
];
const detailValue = (key: string | string[]) =>
  firstOf(detailRows.map((source) => source.hasText(key)));
const cleanDetailValue = (key: string | string[]) =>
  cleanText.chain([strip(key), trimAllSpace()]);

export const amazonJpMusicSubject: SubjectSourceDefinition = {
  key: 'amazon_jp_music',
  description: 'amazon jp music',
  host: ['amazon.co.jp', 'www.amazon.co.jp'],
  type: SubjectTypeId.music,
  pageSource: firstOf([
    dom('#wayfinding-breadcrumbs_container .a-unordered-list .a-list-item:first-child')
      .find('.a-link-normal')
      .hasText(['ミュージック', 'Music', 'MUSIC', '音楽']),
    dom('#nav-subnav .nav-a:first-child img[alt="デジタルミュージック"]'),
    dom('#detailBullets_feature_div + .a-unordered-list')
      .find('.a-list-item')
      .hasText(['ミュージック', '音楽']),
  ]),
  controlSource: dom('#title'),
  itemList: [
    {
      name: '名称',
      source: dom('#productTitle'),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_title' },
    },
    {
      name: '艺术家',
      source: firstOf([
        dom('#bylineInfo')
          .find('.author')
          .hasText(/\(アーティスト\)/)
          .scope(firstOf([dom('.contributorNameID'), dom('a')])),
        dom('#byline .author span.a-size-medium'),
        dom('#bylineInfo .author > a'),
        dom('#bylineInfo .contributorNameID'),
      ]),
      clean: cleanText.chain([strip(/\(アーティスト\)/)]),
      emit: { category: 'creator' },
    },
    {
      name: '碟片数量',
      source: detailValue(['ディスク枚数']),
      clean: cleanDetailValue(['ディスク枚数']),
    },
    {
      name: '内容简介',
      source: firstOf([
        dom('#productDescription').find('h3').hasText(['内容紹介', '内容']).next(),
        dom('#productDescription'),
      ]),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_summary' },
    },
    {
      name: '价格',
      source: firstOf([
        dom('#corePrice_feature_div > div > div > span.a-price.aok-align-center > span.a-offscreen'),
        dom('#corePriceDisplay_desktop_feature_div > div.a-section.a-spacing-none.aok-align-center.aok-relative > span.aok-offscreen'),
        dom('#declarative_ > table > tbody > tr > td.a-text-right.dp-new-col > span > a > span'),
      ]),
    },
  ],
};
