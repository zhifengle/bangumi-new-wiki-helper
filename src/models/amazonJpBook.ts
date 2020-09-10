import { SiteConfig, SubjectTypeId } from '../interface/wiki';

// TODO: 区分 kindle 页面和 纸质书页面
export const amazonSubjectModel: SiteConfig = {
  key: 'amazon_jp_book',
  host: ['amazon.co.jp', 'www.amazon.co.jp'],
  description: '日亚图书',
  type: SubjectTypeId.book,
  pageSelectors: [
    {
      selector: '#nav-subnav .nav-a:first-child',
      subSelector: '.nav-a-content',
      keyWord: '(?<!Kindle)本',
    },
    {
      selector:
        '#wayfinding-breadcrumbs_container .a-unordered-list .a-list-item:first-child',
      subSelector: '.a-link-normal',
      keyWord: '(?<!Kindle)本',
    },
  ],
  controlSelector: {
    selector: '#title',
  },
  itemList: [],
};
amazonSubjectModel.itemList.push(
  {
    name: '名称',
    selector: {
      selector: '#productTitle',
    },
    category: 'subject_title',
  },
  {
    name: 'cover',
    selector: [
      {
        selector: 'img#igImage',
      },
      {
        selector: 'img#imgBlkFront',
      },
    ],
    category: 'cover',
  },
  {
    name: 'ASIN',
    selector: {
      selector: '#detail_bullets_id .bucket .content',
      subSelector: 'li',
      keyWord: 'ISBN-10',
      separator: ':',
    },
    category: 'ASIN',
  },
  {
    name: 'ISBN',
    selector: {
      selector: '#detail_bullets_id .bucket .content',
      subSelector: 'li',
      keyWord: 'ISBN-13',
      separator: ':',
    },
    category: 'ISBN',
  },
  {
    name: '发售日',
    selector: {
      selector: '#detail_bullets_id .bucket .content',
      subSelector: 'li',
      keyWord: '発売日',
      separator: ':',
    },
    category: 'date',
  },
  {
    name: '作者',
    selector: [
      {
        selector: '#bylineInfo',
        subSelector: '.author',
        keyWord: '著',
        nextSelector: [
          {
            selector: '.contributorNameID',
          },
          {
            selector: 'a',
          },
        ],
      },
      {
        selector: '#byline .author span.a-size-medium',
      },
      {
        selector: '#bylineInfo .author > a',
      },
      {
        selector: '#bylineInfo .contributorNameID',
      },
    ],
    category: 'creator',
  },
  {
    name: '插图',
    selector: [
      {
        selector: '#bylineInfo',
        subSelector: '.author',
        keyWord: 'イラスト',
        nextSelector: [
          {
            selector: '.contributorNameID',
          },
          {
            selector: 'a',
          },
        ],
      },
    ],
    category: 'creator',
  },
  {
    name: '出版社',
    selector: {
      selector: '#detail_bullets_id .bucket .content',
      subSelector: 'li',
      separator: ':',
      keyWord: '出版社',
    },
  },
  {
    name: '页数',
    selector: {
      selector: '#detail_bullets_id .bucket .content',
      subSelector: 'li',
      separator: ':',
      keyWord: 'ページ',
    },
  },
  {
    name: '价格',
    selector: [
      {
        selector: '.swatchElement.selected .a-color-base .a-size-base',
      },
      {
        selector: '.swatchElement.selected .a-color-base',
      },
    ],
  },
  {
    name: '内容简介',
    selector: [
      {
        selector: '#productDescription',
        subSelector: 'h3',
        sibling: true,
        keyWord: ['内容紹介', '内容'],
      },
      {
        selector: '#bookDesc_iframe',
        subSelector: '#iframeContent',
        isIframe: true,
      },
    ],
    category: 'subject_summary',
  }
);
