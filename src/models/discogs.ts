import { Selector, SiteConfig, SubjectTypeId } from '../interface/wiki';

export const discogsModel: SiteConfig = {
  key: 'discogs',
  description: 'discogs',
  host: ['www.discogs.com'],
  type: SubjectTypeId.music,
  pageSelectors: [
    {
      selector: 'h1.title_1q3xW',
    },
  ],
  controlSelector: {
    selector: 'h1.title_1q3xW',
  },
  itemList: [],
};

const commonSelectors: Selector = {
  selector: 'table.table_1fWaB',
  subSelector: 'tr > th',
  sibling: true,
};

discogsModel.itemList.push(
  {
    name: '唱片名',
    selector: {
      selector: 'h1.title_1q3xW',
    },
    category: 'subject_title',
  },
  // {
  //   name: '版本特性',
  //   selector: [
  //     {
  //       ...commonSelectors,
  //       keyWord: '発売日',
  //     },
  //   ],
  // },
  {
    name: '发售日期',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Released',
      },
    ],
    // pipes: ['date']
  },
  {
    name: '版本特性',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Format',
      },
    ],
  },
  {
    name: '风格',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Genre',
      },
    ],
  },
  {
    name: '语言',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Country',
      },
    ],
  }
  /*
  {
    name: '价格',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Price',
      },
    ],
  },
  {
    name: '播放时长',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Country',
      },
    ],
  },
  {
    name: '录音',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Country',
      },
    ],
  },
  {
    name: '碟片数量',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Country',
      },
    ],
  },
  */
);
