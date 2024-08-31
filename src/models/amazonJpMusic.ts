import { Selector, SiteConfig, SubjectTypeId } from '../interface/wiki';

// ref links
// https://www.amazon.co.jp/dp/B07FQ5WPM3/
// https://www.amazon.co.jp/dp/B0D456FXL4
// https://www.amazon.co.jp/dp/B07GQXDHLN

export const amazonJpMusicModel: SiteConfig = {
  key: 'amazon_jp_music',
  description: 'amazon jp music',
  host: ['amazon.co.jp', 'www.amazon.co.jp'],
  type: SubjectTypeId.music,
  pageSelectors: [
    {
      selector:
        '#wayfinding-breadcrumbs_container .a-unordered-list .a-list-item:first-child',
      subSelector: '.a-link-normal',
      keyWord: ['ミュージック', 'Music', 'MUSIC', '音楽'],
    },
    {
      selector: '#nav-subnav .nav-a:first-child img[alt="デジタルミュージック"]',
    },
    {
      selector: '#detailBullets_feature_div + .a-unordered-list',
      subSelector: '.a-list-item',
      keyWord: ['ミュージック', '音楽'],
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

amazonJpMusicModel.itemList.push(
  {
    name: '名称',
    selector: {
      selector: '#productTitle',
    },
    category: 'subject_title',
  },
  {
    name: '艺术家',
    selector: [
      {
        selector: '#bylineInfo',
        subSelector: '.author',
        keyWord: '\\(アーティスト\\)',
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
    name: '碟片数量',
    selector: commonSelectors.map((s) => {
      return {
        ...s,
        keyWord: ['ディスク枚数'],
      };
    }),
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
        selector: '#productDescription',
      },
    ],
    category: 'subject_summary',
  },
  {
    name: '价格',
    selector: [
      {
        selector: '#corePrice_feature_div > div > div > span.a-price.aok-align-center > span.a-offscreen',
      },
      {
        selector: '#corePriceDisplay_desktop_feature_div > div.a-section.a-spacing-none.aok-align-center.aok-relative > span.aok-offscreen',
      },
      {
        selector: '#declarative_ > table > tbody > tr > td.a-text-right.dp-new-col > span > a > span',
      },
    ],
  },
  // @TOOD 艺术家, 作词, 作曲, 编曲
);
