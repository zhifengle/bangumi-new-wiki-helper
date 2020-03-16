import {SiteConfig, SubjectTypeId} from "../interface/wiki";

export const amazonSubjectModel: SiteConfig = {
  key: 'amazon_jp_book',
  description: '日亚图书',
  type: SubjectTypeId.book,
  // subType: {
  //   selector: '#detail_bullets_id .bucket .content',
  //   subSelector: 'li',
  //   separator: ':',
  //   keyWord: 'ページ'
  // },
  itemList: []
}
amazonSubjectModel.itemList.push(
  {
    name: '名称',
    selector: {
      selector: '#productTitle',
    },
    category: 'subject_title'
  },
  {
    name: 'cover',
    selector: {
      selector: 'img#imgBlkFront',
    },
    // selector: 'img#igImage'
    category: 'cover'
  },
  {
    name: 'ASIN',
    selector: {
      selector: '#detail_bullets_id .bucket .content',
      subSelector: 'li',
      keyWord: 'ISBN-10',
      separator: ':',
    },
    category: 'ASIN'
  },
  {
    name: 'ISBN',
    selector: {
      selector: '#detail_bullets_id .bucket .content',
      subSelector: 'li',
      keyWord: 'ISBN-13',
      separator: ':',
    },
    category: 'ISBN'
  },
  {
    name: '发售日',
    selector: {
      selector: '#detail_bullets_id .bucket .content',
      subSelector: 'li',
      keyWord: '発売日',
      separator: ':',
    },
    category: 'date'
  },
  {
    name: '作者',
    selector: [
      {
        selector: '#byline .author span.a-size-medium'
      },
      {
        selector: '#bylineInfo .author > a'
      },
      {
        selector: '#bylineInfo .contributorNameID'
      },
    ]
  },
  {
    name: '出版社',
    selector: {
      selector: '#detail_bullets_id .bucket .content',
      subSelector: 'li',
      separator: ':',
      keyWord: '出版社'
    }
  },
  {
    name: '页数',
    selector: {
      selector: '#detail_bullets_id .bucket .content',
      subSelector: 'li',
      separator: ':',
      keyWord: 'ページ'
    },
  },
  {
    name: '价格',
    selector: {
      selector: '.swatchElement.selected .a-color-base'
    }
  },
  {
    name: '内容简介',
    selector: {
      selector: '#productDescription',
      subSelector: 'h3',
      sibling: true,
      keyWord: ['内容紹介', '内容'],
    },
    category: 'subject_summary'
  }
)
