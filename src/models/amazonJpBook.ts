import { Selector, SiteConfig, SubjectTypeId } from '../interface/wiki';

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
      keyWord: ['本', '书', '漫画', 'マンガ', 'Audible'],
    },
    {
      selector:
        '#wayfinding-breadcrumbs_container .a-unordered-list .a-list-item:first-child',
      subSelector: '.a-link-normal',
      keyWord: ['本', '书', '漫画', 'マンガ', 'Audible'],
    },
  ],
  controlSelector: {
    selector: '#title',
  },
  itemList: [],
};

const commonSelectors: Selector[] = [
  // 2021-05 日亚改版
  {
    selector: '#richProductInformation_feature_div',
    subSelector: 'ol.a-carousel li',
  },
  {
    selector: '#detailBullets_feature_div .detail-bullet-list',
    subSelector: 'li .a-list-item',
  },
  {
    selector: '#detail_bullets_id .bucket .content',
    subSelector: 'li',
  },
];
amazonSubjectModel.itemList.push(
  {
    name: '名称',
    selector: {
      selector: '#productTitle',
    },
    category: 'subject_title',
  },
  // 在 afterGetWikiData 获取封面
  // {
  //   name: 'cover',
  //   selector: [
  //     {
  //       selector: 'img#igImage',
  //     },
  //   ],
  //   category: 'cover',
  // },
  {
    name: 'ASIN',
    selector: commonSelectors.map((s) => {
      return {
        ...s,
        keyWord: ['ASIN', 'ISBN-10'],
      };
    }),
    category: 'ASIN',
  },
  {
    name: 'ISBN',
    selector: commonSelectors.map((s) => {
      return {
        ...s,
        keyWord: 'ISBN-13',
      };
    }),
    category: 'ISBN',
    pipes: ['k', 'ta'],
  },
  {
    name: '发售日',
    selector: commonSelectors.map((s) => {
      return {
        ...s,
        keyWord: ['発売日', '出版日期', '配信日'],
      };
    }),
    category: 'date',
    pipes: ['ta', 'k', 'p', 'date'],
  },
  {
    name: '出版社',
    selector: [
      {
        selector: '#bylineInfo',
        subSelector: '.author',
        keyWord: '\\(出版社\\)',
        nextSelector: [
          {
            selector: '.a-link-normal',
          },
          {
            selector: 'a',
          },
        ],
      },
      ...commonSelectors.map((s) => {
        return {
          ...s,
          keyWord: '出版社',
        };
      }),
    ],
  },
  {
    name: '页数',
    selector: commonSelectors.map((s) => {
      return {
        ...s,
        keyWord: ['ページ', '页'],
      };
    }),
    pipes: ['num'],
  },
  // 有声书
  {
    name: '播放时长',
    selector: commonSelectors.map((s) => {
      return {
        ...s,
        keyWord: ['再生時間'],
      };
    }),
  },
  {
    name: '演播',
    selector: commonSelectors.map((s) => {
      return {
        ...s,
        keyWord: ['ナレーター'],
      };
    }),
    pipes: ['ta', 'k'],
  },
  {
    name: '作者',
    selector: [
      {
        selector: '#bylineInfo',
        subSelector: '.author',
        keyWord: '\\(著\\)',
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
    name: '价格',
    selector: [
      {
        selector: '#tmmSwatches .a-button-selected .slot-price',
      },
      {
        selector: '#tmm-grid-swatch-OTHER .slot-price',
      },
      {
        selector: '#tmm-grid-swatch-PAPERBACK .slot-price',
      },
      {
        selector: '#tmmSwatches > div > div:last-child .slot-price',
      },
    ],
    pipes: ['ta'],
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
        selector: '#bookDescription_feature_div .a-expander-content',
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
