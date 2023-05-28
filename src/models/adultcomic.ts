import {
  InfoConfig,
  Selector,
  SiteConfig,
  SubjectTypeId,
} from '../interface/wiki';

export const adultComicModel: SiteConfig = {
  key: 'adultcomic',
  description: 'adultcomic',
  host: ['adultcomic.dbsearch.net'],
  type: SubjectTypeId.book,
  pageSelectors: [
    {
      selector:
        '#pankuz > ol > li:nth-child(1) > a[href*="adultcomic.dbsearch.net"]',
    },
  ],
  controlSelector: {
    selector: '#h2-icon-bk',
  },
  itemList: [],
};

const commonSelectors: Selector[] = [
  {
    selector: '#info-table > div.info-box > dl',
    subSelector: 'dt',
    sibling: true,
  },
];
const genSelectors = (keyWord: string | string[]) =>
  commonSelectors.map((s) => {
    return {
      ...s,
      keyWord,
    };
  });

adultComicModel.itemList.push(
  {
    name: '名称',
    selector: {
      selector: '#h2-icon-bk',
    },
    category: 'subject_title',
  },
  // 图片使用的懒加载. 在 hook 里面读取 data-src
  {
    name: 'cover',
    selector: [
      {
        selector: '#sample-image > figure > a',
      },
      {
        selector: '#info-table > .img-box > img',
      },
    ],
    category: 'cover',
  },
  {
    name: 'ISBN',
    selector: genSelectors('ISBN'),
    category: 'ISBN',
  },
  {
    name: '发售日',
    selector: genSelectors('発売日'),
    category: 'date',
    pipes: ['k', 'date'],
  },
  {
    name: '出版社',
    selector: genSelectors('出版社'),
  },
  {
    name: '页数',
    selector: genSelectors(['ページ']),
    pipes: ['num'],
  },
  {
    name: '作者',
    selector: [
      {
        selector: '#info-table > div.info-box .author-list > li',
      },
      ...genSelectors('漫画家'),
    ],
    category: 'creator',
  },
  {
    name: '价格',
    selector: genSelectors('本体価格'),
  },
  {
    name: '内容简介',
    selector: [
      {
        selector:
          '#comment-clist > .iteminfo-box',
        subSelector: 'h4',
        sibling: true,
        keyWord: ['内容紹介'],
      },
    ],
    category: 'subject_summary',
  }
);
